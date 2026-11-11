-- Normalize owner delivery independently of the existing Edge Function input contract.
-- Clients still see and use the branded address on the website.
begin;

select pg_advisory_xact_lock(492483717);

create or replace function four_u_private.route_project_brief_owner_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pending' then
    new.payload := (new.payload - 'cc' - 'bcc') || jsonb_build_object(
      'sender', jsonb_build_object('email', 'admin@customtechbuilt4u.com', 'name', '4u Digital'),
      'to', jsonb_build_array(jsonb_build_object('email', 'customtechbuilt4u@gmail.com', 'name', '4u Digital'))
    );
  end if;
  return new;
end;
$$;

revoke all on function four_u_private.route_project_brief_owner_email() from public, anon, authenticated;

drop trigger if exists route_project_brief_owner_email on four_u_private.project_briefs;
create trigger route_project_brief_owner_email
before insert or update of payload, status on four_u_private.project_briefs
for each row execute function four_u_private.route_project_brief_owner_email();

-- Cover any queued brief created before this migration, without resending past messages.
update four_u_private.project_briefs
set payload = payload
where status = 'pending';

commit;
