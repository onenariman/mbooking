# Mbooking — технический master plan (backend-first)

Документ для реализации. Сначала backend, затем frontend (`api` + `hooks` + TanStack Query).

---

## 1) Фиксируем продуктовые правила

1. Регистрация/вход owner только через Яндекс OAuth (парольный owner-auth выключаем).
2. После первой регистрации owner получает `trial` на 7 дней.
3. В trial доступно все приложение, кроме `lessons` и `recommendations`.
4. После окончания 7 дней без оплаты доступ к owner-приложению блокируется (paywall).
5. После оплаты (500 ₽ / 30 дней) включается полный доступ.
6. В paid-периоде `recommendations` ограничены 2 генерациями/месяц.
7. `lessons` в paid-периоде без лимита.

---

## 2) Ограничения и риски по регистрации (важно)

Полностью исключить “20 почт” невозможно даже с Яндексом. Что делаем practically:

1. Только Яндекс OAuth для owner.
2. Email в `User` уже unique — сохраняем.
3. Добавляем device/ip risk limits на регистрацию/логин (throttler + audit).
4. Опционально (этап 2): привязка телефона через OTP для усиления анти-мультиаккаунта.

---

## 3) Backend этап 1 — Auth migration на Яндекс OAuth

## 3.1 Что меняем в таблицах

### Новая таблица `OAuthIdentity`
- `id` uuid pk
- `userId` uuid fk -> `User.id`
- `provider` enum (`yandex`)
- `providerUserId` string
- `providerEmail` string?
- `createdAt`
- уникальный индекс `(provider, providerUserId)`
- индекс `(userId)`

### Изменения `User`
- `passwordHash` сделать nullable (legacy users).
- добавить `authType` enum (`password`, `oauth_yandex`) default `password`.

## 3.2 Что меняем в `backend/src/modules/auth`
- Добавить oauth endpoints:
  - `GET /v1/auth/yandex/start`
  - `GET /v1/auth/yandex/callback`
- В callback:
  - найти/создать owner `User`;
  - создать `OAuthIdentity` при первом входе;
  - если пользователь новый: создать trial-subscription на 7 дней.
- `POST /v1/auth/register` выключить для owner (через env и/или hard disable).

## 3.3 Env/config
- добавить:
  - `YANDEX_OAUTH_CLIENT_ID`
  - `YANDEX_OAUTH_CLIENT_SECRET`
  - `YANDEX_OAUTH_REDIRECT_URI`

## 3.4 DoD этапа
- новый owner регистрируется только через Яндекс;
- повторный вход работает через oauth, без пароля;
- legacy password owner может быть мигрирован позже (fallback окно по решению).

---

## 4) Backend этап 2 — Billing + Trial + Access lock

## 4.1 Новые таблицы

### `OwnerSubscription`
- `id` uuid pk
- `ownerUserId` uuid unique fk `User.id`
- `status` enum: `trial`, `active`, `expired`, `canceled`
- `trialStartedAt` datetime?
- `trialEndsAt` datetime?
- `currentPeriodStart` datetime?
- `currentPeriodEnd` datetime?
- `createdAt`, `updatedAt`

### `PaymentTransaction`
- `id` uuid pk
- `ownerUserId` uuid fk
- `provider` enum: `yookassa`, `yandex_pay`
- `providerPaymentId` string unique
- `amount` decimal(10,2)
- `currency` string default `RUB`
- `status` enum: `pending`, `succeeded`, `canceled`, `failed`
- `idempotenceKey` string unique
- `metadataJson` jsonb?
- `paidAt` datetime?
- `createdAt`, `updatedAt`

## 4.2 Trial-логика
- На первом oauth signup:
  - `status=trial`
  - `trialStartedAt=now`
  - `trialEndsAt=now + 7 days`
- `SubscriptionAccessService.getAccessState(ownerUserId)` возвращает:
  - `trial_active`
  - `payment_required`
  - `paid_active`

## 4.3 Lock после trial
- На уровне backend guard:
  - если `trialEndsAt < now` и нет paid active -> `403 payment_required`
- Разрешенный whitelist роутов без оплаты:
  - billing checkout/status;
  - logout;
  - технические `me`.

## 4.4 Billing API
- `GET /v1/billing/subscription` -> текущий статус.
- `POST /v1/billing/checkout` -> создать платеж 500 ₽.
- `POST /v1/billing/webhook/:provider` -> webhook обработчик.

## 4.5 Активация после оплаты
- `payment.succeeded`:
  - если trial/expired: `status=active`, `currentPeriodStart=now`, `currentPeriodEnd=now+30d`;
  - если active: продлить от `currentPeriodEnd + 30d`.

## 4.6 DoD этапа
- после 7 дней без оплаты все owner API (кроме whitelist) блокируются;
- после webhook оплаты доступ открывается автоматически.

---

## 5) Backend этап 3 — Lessons domain (premium only)

## 5.1 Таблицы

### `LessonTrack`
- `id`, `slug` unique, `title`, `description`, `sortOrder`, `isPublished`, timestamps

### `Lesson`
- `id`, `trackId` fk, `slug` unique, `title`, `shortDescription`, `contentMd`
- `videoAssetKey` (для signed video URL) или `videoUrl` (временный вариант)
- `durationMin`, `level`, `tags[]`, `sortOrder`, `isPublished`, timestamps
- индекс `(trackId, sortOrder)`

### `LessonProgress`
- `id`, `ownerUserId`, `lessonId`, `isCompleted`, `completedAt`, timestamps
- unique `(ownerUserId, lessonId)`
- индекс `(ownerUserId, isCompleted)`

## 5.2 Модуль `backend/src/modules/lessons`
- `GET /v1/lessons/tracks`
- `GET /v1/lessons/tracks/:trackSlug`
- `GET /v1/lessons`
- `GET /v1/lessons/:slug`
- `POST /v1/lessons/:id/complete`
- `POST /v1/lessons/:id/uncomplete`

## 5.3 Ограничения
- Все endpoints lessons под `premium-access.guard`.
- Возвращать только `isPublished=true`.

## 5.4 DoD этапа
- без оплаты lessons недоступны;
- после оплаты owner может читать уроки и отмечать прогресс.

---

## 6) Backend этап 4 — Recommendations quota (2/месяц)

Сейчас `recommendations.createJob/runJob` не имеют месячного лимита.

## 6.1 Новая таблица `AiRecommendationQuota`
- `id` uuid pk
- `ownerUserId` uuid fk
- `periodStart` date
- `periodEnd` date
- `usedCount` int default 0
- `limitCount` int default 2
- `createdAt`, `updatedAt`
- unique `(ownerUserId, periodStart, periodEnd)`

## 6.2 Логика
- В `RecommendationsService.createJob(...)` до создания job:
  - проверить active paid subscription;
  - проверить и зарезервировать квоту (атомарно).
- Если квота исчерпана:
  - вернуть `403` с кодом `quota_exceeded`.

## 6.3 Какой период выбрать
- фиксируем календарный месяц (1..последний день).

## 6.4 Какие таблицы меняем
- НЕ меняем `AiRecommendation`/`RecommendationJob` структуру для лимита.
- Добавляем отдельную `AiRecommendationQuota` и используем ее как счетчик доступа.

## 6.5 DoD этапа
- 3-я попытка генерации в месяц стабильно отклоняется.

---

## 7) Backend этап 5 — Guards и ограничения API

## 7.1 Новые guards
- `SubscriptionActiveGuard` (для paid-only).
- `TrialOrPaidGuard` (для базовых страниц в trial и paid).
- `AiQuotaGuard` (опционально, либо проверка внутри сервиса).

## 7.2 Куда ставим
- `recommendations` -> paid + quota.
- `lessons` -> paid.
- остальные owner-модули (`appointments`, `clients`, `services`, `categories`) ->
  - trial_active: разрешено;
  - payment_required: запрещено.

---

## 8) Порядок backend реализации (строго)

1. Prisma миграция auth oauth (`OAuthIdentity`, `User` change).
2. OAuth endpoints + выключение owner password register.
3. Prisma миграция subscription/payment.
4. Billing module + webhook.
5. Subscription services + guards + whitelist.
6. Prisma миграция lessons.
7. Lessons module.
8. Prisma миграция AI quota.
9. Интеграция квоты в recommendations.
10. Seed lessons + smoke tests.

---

## 9) Frontend этапы (после backend)

## 9.1 Страницы `app`
- `app/billing/page.tsx`
- `app/paywall/page.tsx`
- `app/billing/success/page.tsx`
- `app/billing/cancel/page.tsx`
- `app/lessons/page.tsx`
- `app/lessons/[track]/page.tsx`
- `app/lessons/[track]/[lesson]/page.tsx`

## 9.2 API слой `src/api`
- `src/api/billing.api.ts`
  - `fetchSubscriptionStatus()`
  - `createCheckout(provider?)`
- `src/api/lessons.api.ts`
  - `fetchLessonTracks()`, `fetchLessons()`, `fetchLessonBySlug()`, `completeLesson()`, `uncompleteLesson()`
- `src/api/auth.api.ts` (oauth start/callback helpers если нужно на фронте)

## 9.3 Hooks `src/hooks` (TanStack Query)
- `src/hooks/billing.hooks.ts`
  - `useSubscriptionStatus`
  - `useCreateCheckout`
- `src/hooks/lessons.hooks.ts`
  - `useLessonTracks`
  - `useLessons`
  - `useLesson`
  - `useCompleteLesson`
- `src/hooks/recommendations.hooks.ts` (дополнить)
  - обработка `quota_exceeded` и отображение остатка лимита.

## 9.4 Query keys (фиксируем)
- `["billing", "subscription"]`
- `["lessons", "tracks"]`
- `["lessons", "list", filters]`
- `["lessons", "detail", slug]`
- `["recommendations", "quota"]` (если отдельный endpoint)

---

## 10) Изменения env и конфигурации

`backend/src/config/env.schema.ts` расширить:
- `YANDEX_OAUTH_CLIENT_ID`
- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_OAUTH_REDIRECT_URI`
- `BILLING_DEFAULT_PROVIDER`
- `SUBSCRIPTION_PRICE_RUB`
- `SUBSCRIPTION_PERIOD_DAYS`
- `TRIAL_DAYS`
- `AI_RECOMMENDATIONS_MONTHLY_LIMIT`
- `YOOKASSA_*` и/или `YANDEX_PAY_*`

---

## 11) Acceptance criteria (обязательные проверки)

1. Новый owner может зарегистрироваться только через Яндекс OAuth.
2. После регистрации owner получает trial 7 дней.
3. В trial недоступны `lessons` и `recommendations`.
4. После trial без оплаты owner получает `payment_required` почти на все owner API.
5. После оплаты owner получает доступ на 30 дней.
6. `recommendations` работают не более 2 раз в месяц.
7. `lessons` доступны без лимита при active paid.
8. Все клиентские hooks работают через TanStack Query без прямых fetch в компонентах.

---

## 12) Что откладываем

- Multi-staff (`docs/MULTI_STAFF_IMPLEMENTATION_PLAN.md`) — после стабилизации монетизации.
- Basic/Pro тарифы — после накопления метрик.


