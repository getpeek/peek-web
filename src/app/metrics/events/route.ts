import { getSql } from "@/metrics/db";
import { isEventName } from "@/metrics/events";

// matches the char_length check in schema.sql; real event names are shorter
const MAX_BODY_LENGTH = 64;

// Deliberately no rate limiting: throttling would mean storing or hashing IPs
// (against the privacy posture) or adding middleware/Redis infra (against the
// cost goal). The dashboard is informational, not billing.
export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && originHost(origin) !== host) {
    return new Response(null, { status: 403 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) {
    return new Response(null, { status: 413 });
  }
  if (!isEventName(body)) {
    return new Response(null, { status: 400 });
  }

  const sql = getSql();
  if (!sql) {
    return new Response(null, { status: 503 });
  }

  // occurred_at defaults to now() server-side — no spoofable client clock
  await sql`INSERT INTO events (event) VALUES (${body})`;
  return new Response(null, { status: 204 });
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}
