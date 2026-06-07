// Dummy content driving the canvas demo. The flow walks Ask → Run → Branch;
// these constants feed the Agent (chat), Query (SQL) and Result nodes.

export const AGENT_PROMPT =
  "find the top 10 users ranked by how many jobs ads they are the recruiter for";

export const AGENT_MODEL = "Qwen/Qwen3.6-35B-A3B";

export const AGENT_REPLY =
  "Here's a query that ranks users by the job ads they recruit for, with the row cap pulled out into a `limit` variable. Run it to see the results.";

export const AGENT_EMPTY_TITLE = "Ask anything about your data";
export const AGENT_EMPTY_SUBTITLE = "connected to analytics_db";

export const SQL_LINES = [
  "SELECT u.id,",
  "       u.email,",
  "       COUNT(j.id) AS job_ads",
  "FROM users u",
  "JOIN job_ads j ON j.recruiter_id = u.id",
  "GROUP BY u.id, u.email",
  "ORDER BY job_ads DESC",
  "LIMIT @limit;",
];

export const SQL_TEXT = SQL_LINES.join("\n");

export const QUERY_TITLE = "top_recruiters.sql";
export const QUERY_META = `${SQL_LINES.length} lines · postgres`;

// the limit variable the agent extracts and feeds into the query (LIMIT @limit)
export const VARIABLE_NAME = "limit";
export const VARIABLE_VALUE = "10";

// ---- result tables (schema-driven so one node renders any table) ----
export type ColumnKind = "pk" | "fk" | "num" | "text";
export type ResultColumn = { key: string; label: string; kind: ColumnKind };
export type ResultRow = Record<string, string | number>;

export const RESULT_TITLE = "top_recruiters";
export const RESULT_META = "84 ms";

export const RESULT_COLUMNS: ResultColumn[] = [
  { key: "user_id", label: "user_id", kind: "pk" },
  { key: "email", label: "email", kind: "text" },
  { key: "job_ads", label: "job_ads", kind: "num" },
];

export const RESULT_ROWS: ResultRow[] = [
  { user_id: "u_001028", email: "kira.l@nesso.io", job_ads: 1842 },
  { user_id: "u_001029", email: "jp@acme.co", job_ads: 1411 },
  { user_id: "u_001030", email: "l.tang@abc.xyz", job_ads: 1187 },
  { user_id: "u_001031", email: "russ@nesso.io", job_ads: 1042 },
  { user_id: "u_001032", email: "vee@acme.co", job_ads: 886 },
  { user_id: "u_001033", email: "marisol@retool.dev", job_ads: 744 },
  { user_id: "u_001034", email: "kim.h@linear.app", job_ads: 652 },
  { user_id: "u_001035", email: "e.ortega@abc.xyz", job_ads: 580 },
  { user_id: "u_001036", email: "oksana@nesso.io", job_ads: 521 },
  { user_id: "u_001037", email: "ben@acme.co", job_ads: 478 },
];

// "Follow reference": clicking a user_id surfaces the rows in other tables that
// foreign-key to it. Row data is parameterised by the clicked id.
export const USER_SETTINGS_COLUMNS: ResultColumn[] = [
  { key: "user_id", label: "user_id", kind: "fk" },
  { key: "theme", label: "theme", kind: "text" },
  { key: "email_digest", label: "email_digest", kind: "text" },
  { key: "timezone", label: "timezone", kind: "text" },
];

export const JOB_ADS_COLUMNS: ResultColumn[] = [
  { key: "id", label: "id", kind: "pk" },
  { key: "recruiter_id", label: "recruiter_id", kind: "fk" },
  { key: "title", label: "title", kind: "text" },
  { key: "status", label: "status", kind: "text" },
];

export function userSettingsRows(userId: string): ResultRow[] {
  return [
    {
      user_id: userId,
      theme: "dark",
      email_digest: "weekly",
      timezone: "Europe/Stockholm",
    },
  ];
}

export function jobAdsRows(userId: string): ResultRow[] {
  return [
    { id: "ad_4821", recruiter_id: userId, title: "Senior Backend Engineer", status: "live" },
    { id: "ad_4822", recruiter_id: userId, title: "Staff Product Designer", status: "live" },
    { id: "ad_4830", recruiter_id: userId, title: "DevOps Lead", status: "paused" },
  ];
}
