import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;

// Lazy so importing this module never dereferences DATABASE_URL — the site
// (and `npm run build`) must work with no database configured.
export function getSql(): Sql | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  client ??= neon(connectionString);
  return client;
}
