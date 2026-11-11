import { formatBriefText, normalizeBrief } from "../../project-brief-schema.js";
import {
  BriefError,
  briefReference,
  buildMail,
  canonicalIp,
  parseSubmission,
} from "../../supabase/functions/project-brief/core.js";

const origin = "https://customtechbuilt4u.com";
const recipient = "admin@customtechbuilt4u.com";
const endpoint = "/api/project-brief";
const receiptLifetime = 10 * 60 * 1000;
const maximumReceipts = 256;
const unavailable = "Online delivery is temporarily unavailable. Your answers and files are still here. You can email your brief below.";
const uncertain = "We could not confirm email delivery. Your answers and files are still here. If you email your brief, mention that you already tried sending it online.";

function json(status, value, extraHeaders = {}) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function failure(status, message, { field, headers } = {}) {
  return json(status, { ok: false, message, error: message, ...(field ? { field } : {}) }, headers);
}

function sent(reference) {
  return json(200, { ok: true, status: "sent", reference });
}

function buildEmail(submission, sender, reference) {
  const mail = buildMail(submission, formatBriefText);
  return {
    from: { email: sender, name: "4u Digital" },
    to: recipient,
    replyTo: mail.replyTo.email,
    subject: mail.subject,
    text: mail.textContent,
    html: mail.htmlContent,
    headers: { "Auto-Submitted": "auto-generated", "X-4u-Brief-Reference": reference },
    attachments: submission.attachments.map(({ name, content }, index) => ({
      filename: name,
      content,
      type: submission.fileMeta[index].type,
      disposition: "attachment",
    })),
  };
}

export function createProjectBriefWorker() {
  // Isolates are temporary. These receipts suppress quick repeats in the same
  // isolate without storing clients' answers or uploads in a separate service.
  const receipts = new Map();
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname !== endpoint) return failure(404, "This page was not found.");
      if (request.method !== "POST") return failure(405, "Use the planner to send a project brief.", { headers: { Allow: "POST" } });
      if (url.origin !== origin || request.headers.get("origin") !== origin) {
        return failure(403, "Please send your brief from customtechbuilt4u.com.");
      }

      const clientIp = canonicalIp(request.headers.get("cf-connecting-ip"));
      if (!clientIp) return failure(403, "The planner could not verify this connection. Please try again from customtechbuilt4u.com.");
      const sender = env.PROJECT_BRIEF_FROM;
      if (typeof sender !== "string" || !/^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(sender) || !env.PROJECT_BRIEF_EMAIL || !env.BRIEF_IP_LIMIT || !env.BRIEF_LOCATION_LIMIT) {
        return failure(503, unavailable);
      }

      let submission;
      try {
        const perIp = await env.BRIEF_IP_LIMIT.limit({ key: clientIp });
        const perLocation = perIp.success && await env.BRIEF_LOCATION_LIMIT.limit({ key: "project-brief" });
        if (!perLocation?.success) return failure(429, "The planner is receiving too many requests. Please wait a minute and try again.", { headers: { "Retry-After": "60" } });
        submission = await parseSubmission(request, normalizeBrief, Date.now(), { attachmentContent: (bytes) => bytes.buffer });
      } catch (error) {
        if (error instanceof BriefError) return failure(error.status, error.message, { field: error.field });
        return failure(503, unavailable);
      }

      const now = Date.now();
      const reference = briefReference(submission.requestId);
      for (const [id, receipt] of receipts) if (receipt.expiresAt <= now) receipts.delete(id);
      const previous = receipts.get(submission.requestId);
      if (previous) {
        if (previous.fingerprint !== submission.fingerprint) return failure(409, "This reference was already used for another brief. Please reload and review your answers before sending.");
        if (previous.state === "sent") return sent(reference);
        if (previous.state === "uncertain") return failure(503, uncertain);
        return failure(409, "This brief is still being sent. Please wait before checking again.", { headers: { "Retry-After": "15" } });
      }
      if (receipts.size >= maximumReceipts) return failure(503, unavailable);

      const receipt = { fingerprint: submission.fingerprint, expiresAt: now + receiptLifetime, state: "pending" };
      receipts.set(submission.requestId, receipt);
      try {
        const result = await env.PROJECT_BRIEF_EMAIL.send(buildEmail(submission, sender, reference));
        if (typeof result?.messageId !== "string" || !result.messageId.trim()) throw new Error("Missing send receipt");
        receipt.state = "sent";
        return sent(reference);
      } catch (error) {
        // Cloudflare's documented rate error is a rejection before acceptance.
        if (error?.code === "E_RATE_LIMIT_EXCEEDED") {
          receipts.delete(submission.requestId);
          return failure(429, unavailable, { headers: { "Retry-After": "60" } });
        }
        receipt.state = "uncertain";
        return failure(503, uncertain);
      }
    },
  };
}

export default createProjectBriefWorker();
