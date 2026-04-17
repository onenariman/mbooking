# Mbooking Backend — поэтапный план внедрения

Рабочий документ для реализации backend-части по `IMPLEMENTATION_MASTER_PLAN.md`.

Цель: внедрить монетизацию, уроки и AI-квоты с минимальной сложностью и понятной последовательностью.

---

## 0) Scope backend (что делаем)

- Billing-домен (подписка + платежи + webhook).
- Lessons-домен (направления, уроки, прогресс).
- Централизованный доступ по подписке (`SubscriptionAccessService`).
- Квоты на AI-рекомендации (`AiQuotaService`, лимит 2/месяц).
- Гейтинг `recommendations` и `lessons` на уровне backend API.

Не делаем в этом этапе:
- multi-staff;
- сложные тарифные планы `basic/pro`;
- автопродление в первой версии (только ручная оплата/продление).

---

## 1) Архитектурные решения (зафиксировать до кода)

1. Тариф один: `Mbooking Pro 500 RUB / 30 days`.
2. Источник истины для активации подписки: только webhook.
3. Платежные провайдеры через интерфейс:
   - `BillingProvider`;
   - `YookassaProvider`;
   - `YandexPayProvider` (вторым шагом).
4. Lessons доступны только при активной подписке.
5. Recommendations доступны при активной подписке + не превышенной квоте.

---

## 2) Этап A — Prisma и миграции

## 2.1 Добавить enums
- `SubscriptionStatus` (`trial`, `active`, `expired`, `canceled`).
- `PaymentProvider` (`yookassa`, `yandex_pay`).
- `PaymentStatus` (`pending`, `succeeded`, `canceled`, `failed`).

## 2.2 Добавить модели
1. `OwnerSubscription`
   - `id`, `ownerUserId` (unique), `status`, `currentPeriodStart`, `currentPeriodEnd`, `createdAt`, `updatedAt`.
2. `PaymentTransaction`
   - `id`, `ownerUserId`, `provider`, `providerPaymentId` (unique), `amount`, `currency`, `status`, `idempotenceKey` (unique), `metadataJson`, `paidAt`, `createdAt`, `updatedAt`.
3. `LessonTrack`
   - `id`, `slug`, `title`, `description`, `sortOrder`, `isPublished`, timestamps.
4. `Lesson`
   - `id`, `trackId`, `slug`, `title`, `shortDescription`, `contentMd`, `videoUrl` (или `videoAssetKey`), `durationMin`, `level`, `tags`, `sortOrder`, `isPublished`, timestamps.
5. `LessonProgress`
   - `id`, `ownerUserId`, `lessonId`, `isCompleted`, `completedAt`, timestamps, unique `(ownerUserId, lessonId)`.
6. `AiRecommendationQuota`
   - `id`, `ownerUserId`, `periodStart`, `periodEnd`, `usedCount`, `limitCount`, timestamps, unique `(ownerUserId, periodStart, periodEnd)`.

## 2.3 Индексы и ограничения
- Индексы на `ownerUserId` в таблицах подписки/квот/прогресса.
- Уникальность `providerPaymentId` и `idempotenceKey`.
- Индекс `Lesson(trackId, sortOrder)`.

## 2.4 Результат этапа (DoD)
- Миграция проходит локально без ошибок.
- Prisma client генерируется.
- Схема готова для модулей billing/lessons/quota.

---

## 3) Этап B — Billing module

Папка: `backend/src/modules/billing/`

## 3.1 Создать структуру
- `billing.module.ts`
- `billing.controller.ts`
- `billing.service.ts`
- `providers/billing-provider.interface.ts`
- `providers/yookassa.provider.ts`
- `providers/yandex-pay.provider.ts` (можно stub на первом шаге)
- `dto/create-checkout.dto.ts`
- `dto/payment-webhook.dto.ts`
- `billing.types.ts`

## 3.2 Эндпоинты
- `GET /v1/billing/subscription`
- `POST /v1/billing/checkout` (по умолчанию `provider=yookassa`)
- `POST /v1/billing/webhook/yookassa` (public)
- `POST /v1/billing/webhook/yandex-pay` (public, можно отключить до подключения)

## 3.3 Ключевая логика
- `createCheckout(ownerUserId)`:
  - создать pending `PaymentTransaction`;
  - сохранить `idempotenceKey`;
  - вернуть redirect URL.
- `handlePaymentSucceeded(...)`:
  - идемпотентно обновить транзакцию до `succeeded`;
  - активировать/продлить `OwnerSubscription` на 30 дней.

## 3.4 Безопасность
- Проверять сумму `500 RUB`.
- Сверять подпись/валидность webhook (по требованиям провайдера).
- Ограничить логирование чувствительных данных.

## 3.5 Результат этапа (DoD)
- После тестового webhook `payment.succeeded` подписка становится `active`.
- Повторный webhook не ломает данные (идемпотентность).

---

## 4) Этап C — Subscription access control

## 4.1 Новый сервис
`backend/src/modules/billing/subscription-access.service.ts`

Методы:
- `getSubscriptionState(ownerUserId)`
- `hasPremiumAccess(ownerUserId)`
- `assertPremiumAccess(ownerUserId)` -> бросает `ForbiddenException` с кодом `subscription_required`.

## 4.2 Guard
`backend/src/common/guards/premium-access.guard.ts`

Применить к:
- `backend/src/modules/recommendations/*`
- `backend/src/modules/lessons/*`

## 4.3 Результат этапа (DoD)
- Без подписки backend возвращает 403 на premium endpoints.
- С активной подпиской доступ открыт.

---

## 5) Этап D — Lessons module

Папка: `backend/src/modules/lessons/`

## 5.1 Структура
- `lessons.module.ts`
- `lessons.controller.ts`
- `lessons.service.ts`
- `dto/list-lessons.query.dto.ts`
- `dto/complete-lesson.dto.ts`
- `lessons.types.ts`

## 5.2 API
- `GET /v1/lessons/tracks`
- `GET /v1/lessons/tracks/:trackSlug`
- `GET /v1/lessons?track=&search=&level=&completed=&page=&limit=`
- `GET /v1/lessons/:slug`
- `POST /v1/lessons/:id/complete`
- `POST /v1/lessons/:id/uncomplete`

## 5.3 Логика
- Возвращать только `isPublished = true`.
- Встраивать прогресс owner в ответы.
- Поддержка поиска/фильтра без тяжелых join.

## 5.4 Результат этапа (DoD)
- Подписчик видит направления/уроки.
- Отметка "изучено" сохраняется корректно.

---

## 6) Этап E — AI quota service

Папка: `backend/src/modules/recommendations/` + общий сервис.

## 6.1 Сервис квот
`AiQuotaService`:
- `getOrCreateCurrentPeriod(ownerUserId)`
- `canConsume(ownerUserId)`
- `consume(ownerUserId)` (атомарно)
- `getQuotaState(ownerUserId)`

## 6.2 Интеграция в recommendations
- Перед запуском генерации:
  1. проверить подписку;
  2. проверить квоту;
  3. попытаться `consume`.
- При превышении вернуть 429/403 с кодом `quota_exceeded`.

## 6.3 Период квоты
- Рекомендуется календарный месяц:
  - проще объяснение пользователю;
  - проще аналитика.

## 6.4 Результат этапа (DoD)
- Лимит 2/месяц стабильно соблюдается.
- Ошибки квоты детерминированные и читаемые для фронта.

---

## 7) Этап F — Seed и операционка

## 7.1 Seed lessons
- Добавить 2 направления:
  - Электроэпиляция
  - Косметология
- Добавить 5-10 уроков в каждое направление.

## 7.2 Конфиги env
- `BILLING_DEFAULT_PROVIDER=yookassa`
- `SUBSCRIPTION_PRICE_RUB=500`
- `SUBSCRIPTION_PERIOD_DAYS=30`
- провайдерные ключи (`YOOKASSA_*`, `YANDEX_PAY_*`)

## 7.3 Логи и мониторинг
- Логи checkout/webhook с correlation id.
- Метрики:
  - `payments_created`
  - `payments_succeeded`
  - `subscription_activated`
  - `quota_exceeded_total`

---

## 8) Проверки (backend test checklist)

1. Новый owner без подписки:
   - `recommendations` -> 403 `subscription_required`
   - `lessons` -> 403 `subscription_required`
2. Успешный платеж:
   - подписка `active`, период +30 дней.
3. Повторный webhook:
   - дубль не создает вторую активацию.
4. Активная подписка + рекомендации:
   - 1 и 2 запрос успешны, 3 запрос -> `quota_exceeded`.
5. Продление активной подписки:
   - `currentPeriodEnd` увеличивается на 30 дней, а не сбрасывается.

---

## 9) Порядок внедрения (краткий)

1. Prisma (billing + lessons + quotas).
2. Billing module + webhook.
3. Premium access service/guard.
4. Lessons module.
5. AI quota integration.
6. Seed + observability.

---

## 10) Ready for frontend handoff

Backend считается готовым для фронтенда, когда:
- есть стабильный `GET /v1/billing/subscription`;
- работает `POST /v1/billing/checkout`;
- premium guards активны;
- lessons API полностью отвечает;
- рекомендации возвращают корректный статус квоты.

