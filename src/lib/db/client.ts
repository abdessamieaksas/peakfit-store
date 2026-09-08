import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let cachedDb: ReturnType<typeof createDb> | undefined;

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Neon database access.");
  }

  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
}

export function getDb() {
  cachedDb ??= createDb();
  return cachedDb;
}
