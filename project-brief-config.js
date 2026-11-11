export const briefEndpoint = "/api/project-brief";

// Static mirrors have no mail handler. Loopback is for local testing.
export const canSendBriefOnline = (hostname) => ["customtechbuilt4u.com", "localhost", "127.0.0.1", "[::1]"].includes(hostname);
