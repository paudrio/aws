import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Carga manual absoluta y relativa para VPS
const envPath = path.resolve(process.cwd(), ".env");
const absoluteEnvPath = "/var/www/paudronix/.env";

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(absoluteEnvPath)) {
  dotenv.config({ path: absoluteEnvPath });
}

if (!process.env.DATABASE_URL) {
  // Fallback manual para leer la variable si dotenv falla
  try {
    const targetFile = fs.existsSync(envPath) ? envPath : (fs.existsSync(absoluteEnvPath) ? absoluteEnvPath : null);
    if (targetFile) {
      const envContent = fs.readFileSync(targetFile, "utf-8");
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1].trim().replace(/['"]/g, '');
      }
    }
  } catch (e) {}
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
