import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let cachedDb: ReturnType<typeof createDb> | undefined;
let cachedSql: ReturnType<typeof neon> | undefined;

export function getNeonClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for Neon database access.");
  cachedSql ??= neon(databaseUrl);
  return cachedSql;
}

function createDb() {
  return drizzle({ client: getNeonClient(), schema });
}

export function getDb() {
  cachedDb ??= createDb();
  return cachedDb;
}
