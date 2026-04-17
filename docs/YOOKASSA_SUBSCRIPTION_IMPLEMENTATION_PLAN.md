# Mbooking: внедрение подписки через ЮKassa (500 ₽ / 30 дней)

Документ описывает, как внедрить платный доступ в Mbooking: пользователь знакомится с приложением, оплачивает подписку через ЮKassa и получает полный доступ на 30 дней.

---

## 1) Продуктовая модель доступа

## Что пользователь видит до оплаты
- Доступ к базовым страницам ознакомления (например, `receptions`, `clients`, `services` в read-only или с мягкими ограничениями).
- Страницы `уроки` и `рекомендации` скрыты или показывают paywall.

## Что получает после оплаты
- Полный доступ ко всем функциям на 30 дней:
  - уроки (все направления, без ограничений по специализации);
  - рекомендации;
  - остальные инструменты продукта.

## Тариф MVP
- 500 ₽ за 30 дней.
- Без сложных планов/промокодов на старте.

---

## 2) Ключевой пользовательский сценарий

1. Пользователь регистрируется/логинится как owner.
2. Пользуется демо-возможностями и видит ограничения premium-блоков.
3. Нажимает `Оформить подписку`.
4. Перенаправляется в ЮKassa Checkout.
5. После успешной оплаты ЮKassa отправляет webhook в backend.
6. Backend продлевает доступ (`currentPeriodEnd = now + 30 days`).
7. Пользователь возвращается в приложение и получает полный доступ.

---

## 3) Архитектура backend (`backend`)

## 3.1 Новые сущности в Prisma

Рекомендуемый минимальный набор:

```prisma
enum SubscriptionStatus {
  trial
  active
  past_due
  canceled
  expired
}

enum PaymentStatus {
  pending
  succeeded
  canceled
  failed
}

model OwnerSubscription {
  id                 String   @id @default(uuid()) @db.Uuid
  ownerUserId        String   @unique @db.Uuid
  status             SubscriptionStatus @default(trial)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  canceledAt         DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model PaymentTransaction {
  id                  String   @id @default(uuid()) @db.Uuid
  ownerUserId         String   @db.Uuid
  provider            String   // "yookassa"
  providerPaymentId   String   @unique
  amount              Decimal  @db.Decimal(10,2)
  currency            String   @default("RUB")
  status              PaymentStatus
  description         String?
  idempotenceKey      String   @unique
  metadataJson        Json?
  paidAt              DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([ownerUserId, createdAt])
}
```

Примечание: подписка привязана к owner-аккаунту, а не к отдельным мастерам.

## 3.2 Новый модуль billing

Создать: `backend/src/modules/billing/`

Состав:
- `billing.module.ts`
- `billing.controller.ts`
- `billing.service.ts`
- `yookassa.client.ts`
- `dto/create-checkout.dto.ts`
- `dto/yookassa-webhook.dto.ts`
- `guards/subscription-access.guard.ts`

Подключить `BillingModule` в `backend/src/app.module.ts`.

## 3.3 Основные API для owner

- `GET /v1/billing/subscription`
  - вернуть текущий статус: active/expired, дата окончания, дни до окончания.

- `POST /v1/billing/checkout`
  - создать платеж 500 ₽;
  - вернуть `confirmation_url` для редиректа в ЮKassa.

- `POST /v1/billing/yookassa/webhook` (public endpoint)
  - принимать события ЮKassa;
  - обрабатывать `payment.succeeded` как главный триггер активации.

- `GET /v1/billing/paywall-context`
  - быстрый endpoint для фронта: что закрыто и почему.

## 3.4 Логика активации на 30 дней

При `payment.succeeded`:
- найти `ownerUserId` из metadata платежа;
- записать транзакцию как `succeeded`;
- обновить `OwnerSubscription`:
  - если подписки нет или она просрочена: `currentPeriodStart = now`, `currentPeriodEnd = now + 30 days`;
  - если подписка активна: продлить от текущего `currentPeriodEnd` (`+30 days`);
  - `status = active`.

## 3.5 Идемпотентность и надежность

- На `checkout` отправлять уникальный `idempotence key`.
- В webhook обрабатывать событие идемпотентно (проверка `providerPaymentId`).
- Сохранять сырой payload webhook в `metadataJson`.
- Никогда не активировать подписку по фронтовому редиректу без webhook.

## 3.6 Проверка доступа к premium-фичам

Сделать единый сервис:
- `SubscriptionAccessService.hasPremiumAccess(ownerUserId): boolean`

И применять:
- в backend контроллерах premium-модулей (`recommendations`, будущий `lessons`);
- в frontend для UX-гейтинга (показывать paywall до запроса в protected endpoint).

---

## 4) Интеграция с ЮKassa

## 4.1 Что хранить в env

В `backend/.env`:
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `YOOKASSA_RETURN_URL` (куда вернуть пользователя после оплаты)
- `YOOKASSA_WEBHOOK_SECRET` (если используете подпись/доп.проверку)

## 4.2 Как создавать платеж

`POST /v3/payments` в ЮKassa:
- amount: `500.00 RUB`
- confirmation: `redirect`
- capture: `true`
- description: `Mbooking subscription 30 days`
- metadata:
  - `owner_user_id`
  - `plan_code = monthly_500`

## 4.3 Какие события webhook обрабатывать

Минимум:
- `payment.succeeded` -> активировать/продлить подписку.
- `payment.canceled` -> зафиксировать canceled.

Опционально позже:
- возвраты и чарджбеки.

---

## 5) Frontend (`app`, `components`, `src/api`, `src/hooks`)

## 5.1 Новые страницы

- `app/billing/page.tsx` — управление подпиской (статус, кнопка оплаты).
- `app/paywall/page.tsx` — единый экран ограниченного доступа.
- `app/billing/success/page.tsx` — экран после оплаты (ожидание webhook + проверка статуса).
- `app/billing/cancel/page.tsx` — отмена/неуспешный сценарий.

## 5.2 Гейтинг премиум-разделов

Для `recommendations` и `lessons`:
- SSR-проверка статуса подписки в page guard;
- если нет доступа -> редирект на `/paywall?feature=recommendations` или `/paywall?feature=lessons`.

## 5.3 Навигация и UX

- В меню добавить `Подписка` (`/billing`).
- Для закрытых разделов:
  - показать badge `Premium`;
  - показывать CTA `Оформить за 500 ₽ / 30 дней`.

## 5.4 API/хуки

Новые файлы:
- `src/api/billing.api.ts`
- `src/hooks/billing.hooks.ts`

Методы:
- `fetchSubscriptionStatus()`
- `createCheckoutSession()`
- `fetchPaywallContext()`

---

## 6) Изменения доступа в текущем приложении

## 6.1 Recommendations
- Backend: в `recommendations.controller` добавить guard проверки активной подписки.
- Frontend: в `app/recommendations/*` добавить server-side gate на статус подписки.

## 6.2 Lessons
- Сразу строить модуль как premium-only.
- Без подписки разрешать только заглушку/превью треков (без playback).

## 6.3 Остальной продукт
- Оставить доступ к основным CRM-инструментам для ознакомления (по вашей стратегии).
- Позже можно ввести soft limits (например, лимит записей без подписки).

---

## 7) Пошаговый план внедрения

## Этап A — Data + backend core
1. Добавить Prisma модели `OwnerSubscription`, `PaymentTransaction`.
2. Создать миграцию.
3. Поднять `BillingModule`.
4. Реализовать `GET /billing/subscription` и `POST /billing/checkout`.
5. Реализовать webhook endpoint и идемпотентную обработку `payment.succeeded`.

## Этап B — Feature access control
1. Создать `SubscriptionAccessService`.
2. Добавить premium guard в `recommendations`.
3. Подключить guard в `lessons` (когда модуль уроков будет готов).
4. Протестировать сценарий: без оплаты -> denied, после оплаты -> allowed.

## Этап C — Frontend paywall and billing UX
1. Создать страницы `/billing`, `/paywall`, `/billing/success`, `/billing/cancel`.
2. Добавить `billing.api.ts` и hooks.
3. Добавить редиректы с закрытых страниц.
4. Добавить статус подписки в navbar/кабинет.

## Этап D — Прод-надежность
1. Логи/метрики webhook.
2. Retry для временных ошибок ЮKassa API.
3. Админ-страница транзакций.
4. E2E smoke-тесты оплаты.

---

## 8) Безопасность и антифрод (базовый уровень)

- Доверять только webhook, а не return-url со стороны фронта.
- Проверять `providerPaymentId` и сумму (`500 RUB`) перед активацией.
- Использовать idempotence key при создании платежа.
- Лимитировать частоту `checkout` запросов на пользователя.
- Маскировать чувствительные поля в логах.

---

## 9) Важные решения заранее

Перед реализацией зафиксировать:
1. С какого момента считать 30 дней:
   - от `payment.succeeded` (рекомендуется).
2. Продление при активной подписке:
   - add-on к текущему периоду (рекомендуется).
3. Что делать при истечении:
   - блокировать lessons/recommendations и показывать paywall.
4. Нужен ли trial:
   - можно без trial на старте, только ознакомительный доступ без premium.

---

## 10) KPI после запуска

Отслеживать:
- конверсия в оплату (`owner -> paid`);
- среднее время от регистрации до оплаты;
- доля активных подписок через 30/60 дней;
- доля пользователей, использующих premium-разделы (lessons/recommendations);
- churn после первого периода.

---

## 11) Рекомендуемое решение для текущей стадии

Для вашего текущего продукта оптимально:
- запустить один тариф `500 ₽ / 30 дней`;
- сделать premium-gating для `уроков` и `рекомендаций`;
- внедрить ЮKassa webhook-first;
- добавить простой и понятный paywall.

Это даст быстрый запуск монетизации без перегрузки архитектуры и позволит масштабировать тарифы позже.

