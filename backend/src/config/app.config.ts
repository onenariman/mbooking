import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  database: {
    /** См. ALLOW_START_WITHOUT_DB в env; в production не влияет. */
    allowStartWithoutDb: process.env.ALLOW_START_WITHOUT_DB === "true",
  },
  /** Публичный origin фронта для ссылок (feedback URL), аналог NEXT_PUBLIC_APP_URL */
  publicBaseUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:3000",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    /** Срок жизни opaque refresh-сессии в таблице `RefreshToken` */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  auth: {
    /** Включить только явно `OWNER_PASSWORD_REGISTRATION_ENABLED=true` */
    ownerPasswordRegistrationEnabled:
      process.env.OWNER_PASSWORD_REGISTRATION_ENABLED === "true",
    /** Вход мастера по паролю; клиентский кабинет по-прежнему через пароль */
    ownerPasswordLoginEnabled:
      process.env.OWNER_PASSWORD_LOGIN_ENABLED === "true",
  },
  yandexOAuth: {
    clientId: process.env.YANDEX_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.YANDEX_OAUTH_CLIENT_SECRET ?? "",
    redirectUri: process.env.YANDEX_OAUTH_REDIRECT_URI ?? "",
  },
  /** Общий секрет Next callback → Nest `POST /v1/auth/yandex/token` */
  oauthCallbackSecret: process.env.NEST_OAUTH_CALLBACK_SECRET ?? "",
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
  /** Внутренний cron раз в минуту для напоминаний; выключить, если шлёте только внешний cron на HTTP */
  remindersCronEnabled: process.env.DISABLE_REMINDERS_CRON !== "true",
}));
