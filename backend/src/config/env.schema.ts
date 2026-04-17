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
  /** `true` — разрешить саморегистрацию мастера по паролю (редкий dev / миграция) */
  OWNER_PASSWORD_REGISTRATION_ENABLED: z.enum(["true", "false"]).optional(),
  /** `true` — разрешить вход мастера по паролю (клиентский кабинет не зависит от этого) */
  OWNER_PASSWORD_LOGIN_ENABLED: z.enum(["true", "false"]).optional(),
  YANDEX_OAUTH_CLIENT_ID: z.string().optional(),
  YANDEX_OAUTH_CLIENT_SECRET: z.string().optional(),
  YANDEX_OAUTH_REDIRECT_URI: z.string().optional(),
  /** Должен совпадать с `NEST_OAUTH_CALLBACK_SECRET` на Next (route handler) */
  NEST_OAUTH_CALLBACK_SECRET: z.string().optional(),
  /**
   * Только development/test: разрешить старт API без успешного подключения к БД.
   * В production игнорируется — при недоступной БД процесс завершится при старте.
   */
  ALLOW_START_WITHOUT_DB: z.enum(["true", "false"]).optional(),
  /** `true` — не запускать встроенный cron dispatch напоминаний */
  DISABLE_REMINDERS_CRON: z.enum(["true", "false"]).optional(),
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
