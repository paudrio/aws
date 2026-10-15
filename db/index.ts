import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  const absoluteEnvPath = "/var/www/paudronix/.env";
  const absoluteEnvPath2 = "/var/www/paudronix/pabloemma/.env";
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  else if (fs.existsSync(absoluteEnvPath2)) dotenv.config({ path: absoluteEnvPath2 });
  else if (fs.existsSync(absoluteEnvPath)) dotenv.config({ path: absoluteEnvPath });
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeonOrCloud = process.env.DATABASE_URL?.includes('neon.tech') || 
  process.env.DATABASE_URL?.includes('supabase') ||
  process.env.DATABASE_URL?.includes('render.com');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);
