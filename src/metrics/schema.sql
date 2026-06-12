-- One-time setup for the metrics events table. No migration tooling: paste
-- this into the Neon SQL editor (project → SQL Editor), once for the
-- production branch and once for any dev branch you point .env.local at.
--
-- Privacy: each click stores only an allowlisted event name (see events.ts)
-- and a server-generated timestamp. No IP, user agent, referrer, or any kind
-- of visitor identifier is ever written. (Vercel's own request logs
-- transiently contain IPs as standard infrastructure — outside this table.)

CREATE TABLE IF NOT EXISTS events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL CHECK (char_length(event) <= 64),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_occurred_at_event_idx
  ON events (occurred_at, event);
