import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(8, "JWT_ACCESS_SECRET must be at least 8 chars"),
  /** Не используется (refresh в БД); оставлено опционально для старых .env */
  JWT_REFRESH_SECRET: z.string().min(8).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  PUBLIC_APP_URL: z.string().min(1).optional(),
  /** Список origin через запятую для CORS (фронт на :3000 и т.д.) */
  CORS_ORIGINS: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  YANDEX_FOLDER_ID: z.string().optional(),
  YANDEX_MODEL_URI: z.string().optional(),
  YANDEX_IAM_TOKEN: z.string().optional(),
  YANDEX_API_KEY: z.string().optional(),
  /** Если `false` — отключена саморегистрация мастера по паролю */
  OWNER_PASSWORD_REGISTRATION_ENABLED: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}
