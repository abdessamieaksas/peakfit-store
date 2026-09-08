import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{10,15}$/)
    .default("212600000000"),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.url().optional(),
  DATABASE_URL_DIRECT: z.url().optional(),
  STORE_DATA_SOURCE: z.enum(["sample", "neon"]).default("sample"),
  NEON_AUTH_BASE_URL: z.url().optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  ORDER_RESERVATION_MINUTES: z.coerce.number().int().positive().default(1440),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
});

export function getServerEnv() {
  const env = serverEnvSchema.parse(process.env);

  if (env.STORE_DATA_SOURCE === "neon" && !env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when STORE_DATA_SOURCE is set to neon.",
    );
  }

  return env;
}
