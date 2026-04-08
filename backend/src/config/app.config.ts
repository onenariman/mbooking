import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  /** Публичный origin фронта для ссылок (feedback URL), аналог NEXT_PUBLIC_APP_URL */
  publicBaseUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:3000",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    /** Срок жизни opaque refresh-сессии в таблице `RefreshToken` */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  /** Секрет для cron dispatch напоминаний (Bearer или x-cron-secret), как в Next CRON_SECRET */
  cronSecret: process.env.CRON_SECRET ?? "",
  vapid: {
    publicKey:
      process.env.VAPID_PUBLIC_KEY ??
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
      "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    subject: process.env.VAPID_SUBJECT ?? "",
  },
  ai: {
    yandexFolderId: process.env.YANDEX_FOLDER_ID ?? "",
    yandexModelUri: process.env.YANDEX_MODEL_URI ?? "",
    yandexIamToken: process.env.YANDEX_IAM_TOKEN ?? "",
    yandexApiKey: process.env.YANDEX_API_KEY ?? "",
  },
}));
