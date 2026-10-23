-- 4u Digital project-discovery briefs. Existing Free resources only.
-- This migration deliberately leaves booking, authentication and meeting code untouched.
create schema if not exists four_u_private;
revoke all on schema four_u_private from public, anon, authenticated;
create table four_u_private.project_briefs (
 id uuid primary key,
 reference text not null unique,
 fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
 ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
 answers jsonb not null check (jsonb_typeof(answers)='object'),
 file_meta jsonb not null default '[]'::jsonb check (jsonb_typeof(file_meta)='array'),
 payload jsonb not null check (jsonb_typeof(payload)='object'),
 file_bytes integer not null default 0 check (file_bytes between 0 and 8388608),
 status text not null default 'pending' check(status in ('pending','accepted','uncertain','failed')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 accepted_at timestamptz,
 provider_message_id text,
 last_error text
);
alter table four_u_private.project_briefs enable row level security;
revoke all on four_u_private.project_briefs from public, anon, authenticated;
create index project_briefs_pending_idx on four_u_private.project_briefs (next_attempt_at) where status='pending';
create index project_briefs_created_idx on four_u_private.project_briefs (created_at);
create index project_briefs_ip_idx on four_u_private.project_briefs (ip_hash,created_at);

create function public.submit_4u_project_brief(p_request_id uuid,p_fingerprint text,p_ip_hash text,p_answers jsonb,p_payload jsonb,p_file_bytes integer,p_file_meta jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing four_u_private.project_briefs; ref text; day_start timestamptz;
begin
 perform pg_advisory_xact_lock(492483718);
 select * into existing from four_u_private.project_briefs where id=p_request_id for update;
 if found then
  if existing.fingerprint<>p_fingerprint then return jsonb_build_object('action','conflict'); end if;
  return jsonb_build_object('action','existing','status',existing.status,'reference',existing.reference);
 end if;
 if p_fingerprint !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$'
  or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>204800
  or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>13631488
  or p_file_bytes not between 0 and 8388608 or jsonb_typeof(p_file_meta)<>'array' or jsonb_array_length(p_file_meta)>6
  or (p_payload->'sender'->>'email') is distinct from 'no-reply@briefbooth.com'
  or p_payload->'to' is distinct from jsonb_build_array(jsonb_build_object('email','admin@customtechbuilt4u.com','name','4u Digital'))
 then raise exception 'Invalid project brief payload' using errcode='22023'; end if;
 day_start:=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if (select count(*) from four_u_private.project_briefs where created_at>=day_start)>=15
 or (select count(*) from four_u_private.project_briefs where ip_hash=p_ip_hash and created_at>=day_start)>=3
 then return jsonb_build_object('action','rate_limited'); end if;
 -- Original attachments are transient, bounded independently of the shared Free database.
 if (select coalesce(sum(octet_length(payload::text)),0) from four_u_private.project_briefs)+octet_length(p_payload::text)>67108864
 then return jsonb_build_object('action','capacity'); end if;
 ref:='4U-'||upper(substr(replace(p_request_id::text,'-',''),1,12));
 insert into four_u_private.project_briefs(id,reference,fingerprint,ip_hash,answers,file_meta,payload,file_bytes)
 values(p_request_id,ref,p_fingerprint,p_ip_hash,p_answers,p_file_meta,p_payload,p_file_bytes);
 return jsonb_build_object('action','created','status','pending','reference',ref);
end; $$;
revoke all on function public.submit_4u_project_brief(uuid,text,text,jsonb,jsonb,integer,jsonb) from public,anon,authenticated;
grant execute on function public.submit_4u_project_brief(uuid,text,text,jsonb,jsonb,integer,jsonb) to service_role;

create function four_u_private.purge_project_briefs() returns void language plpgsql security definer set search_path='' as $$
begin
 -- Attachments are purged immediately after provider acceptance. Unsent attachments
 -- have a seven-day recovery window. Submitted answers and delivery metadata last 30 days.
 update four_u_private.project_briefs set payload=payload-'attachment',file_bytes=0,
  status=case when status='pending' then 'failed' else status end,
  last_error=case when status='pending' then 'Attachment recovery window expired; contact client' else last_error end
 where file_bytes>0 and created_at<now()-interval '7 days';
 update four_u_private.project_briefs set status='failed',last_error='Delivery recovery window expired; contact client'
 where status='pending' and created_at<now()-interval '7 days';
 delete from four_u_private.project_briefs where created_at<now()-interval '30 days';
end; $$;
revoke all on function four_u_private.purge_project_briefs() from public,anon,authenticated;

create function four_u_private.send_project_briefs(p_request_id uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare mail four_u_private.project_briefs; api_key text; response extensions.http_response; day_start timestamptz; response_json jsonb;
begin
 -- Share the existing booking delivery lock so brief sends cannot race its worker.
 if not pg_try_advisory_xact_lock(492483717) then return; end if;
 perform four_u_private.purge_project_briefs();
 select decrypted_secret into api_key from vault.decrypted_secrets where name='briefbooth_brevo_api_key';
 if nullif(api_key,'') is null then return; end if;
 day_start:=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 -- Booking Free mail already caps itself at 240. At most 15 brief emails/day
 -- leave headroom for existing authentication mail under Brevo's 300/day Free cap.
 if (select count(*) from four_u_private.project_briefs where accepted_at>=day_start)>=15
 or (select count(*) from briefbooth_private.booking_emails where accepted_at>=day_start)>=240 then return; end if;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','8000');
 perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS','3000');
 for mail in select * from four_u_private.project_briefs
  where status='pending' and next_attempt_at<=now() and (p_request_id is null or id=p_request_id)
  order by created_at limit 1 for update skip locked
 loop
  begin
   select * into response from extensions.http((
    'POST','https://api.brevo.com/v3/smtp/email',
    array[extensions.http_header('api-key',api_key)],'application/json',mail.payload::text
   )::extensions.http_request);
   begin response_json:=response.content::jsonb; exception when others then response_json:='{}'::jsonb; end;
   if response.status between 200 and 299 and nullif(response_json->>'messageId','') is not null then
    update four_u_private.project_briefs set status='accepted',accepted_at=now(),attempts=attempts+1,
     provider_message_id=left(response_json->>'messageId',300),last_error=null,
     payload=payload-'attachment',file_bytes=0 where id=mail.id;
   elsif response.status in (429,401,403) then
    -- Known rejection is safe to retry automatically without a paid fallback.
    update four_u_private.project_briefs set next_attempt_at=now()+interval '1 hour',attempts=attempts+1,
     last_error=case when response.status=429 then 'Provider Free limit; retrying later' else 'Provider credential or sender needs attention; retrying later' end where id=mail.id;
   else
    update four_u_private.project_briefs set status=case when response.status>=500 or response.status between 200 and 299 then 'uncertain' else 'failed' end,
     attempts=attempts+1,last_error='Provider HTTP '||response.status||'; review provider logs before retrying' where id=mail.id;
   end if;
  exception when others then
   -- A network timeout may occur after provider acceptance. Never blindly duplicate.
   update four_u_private.project_briefs set status='uncertain',attempts=attempts+1,
    last_error='Delivery outcome unknown; review provider logs before retrying' where id=mail.id;
  end;
 end loop;
end; $$;
revoke all on function four_u_private.send_project_briefs(uuid) from public,anon,authenticated;

create function public.dispatch_4u_project_brief(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result four_u_private.project_briefs;
begin
 perform four_u_private.send_project_briefs(p_request_id);
 select * into result from four_u_private.project_briefs where id=p_request_id;
 if not found then raise exception 'Brief not found' using errcode='22023'; end if;
 return jsonb_build_object('status',result.status,'reference',result.reference);
end; $$;
revoke all on function public.dispatch_4u_project_brief(uuid) from public,anon,authenticated;
grant execute on function public.dispatch_4u_project_brief(uuid) to service_role;
select cron.schedule('4u-digital-project-briefs','* * * * *','select four_u_private.send_project_briefs()');
select cron.schedule('4u-digital-project-brief-retention','17 * * * *','select four_u_private.purge_project_briefs()');
