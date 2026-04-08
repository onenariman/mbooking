# План Полного Перехода С Supabase На NestJS + Prisma + PostgreSQL + Nginx

## 1. Цель Документа

Этот документ нужен для аккуратного поэтапного ухода:

- с `Supabase Auth`
- с `Supabase Postgres как платформы`
- с `Supabase RPC / RLS / pg_cron`
- с `Vercel` в сторону `Timeweb Cloud Server`

Итоговая целевая архитектура:

- `Next.js` остается фронтендом
- `NestJS` становится полноценным backend API
- `Prisma` становится слоем доступа к БД и схемой миграций
- `PostgreSQL` становится основной базой данных
- `Nginx` становится reverse proxy
- деплой идет на `Timeweb Cloud Server`

Важно: `Prisma` не заменяет Supabase как платформу целиком.  
`Prisma` заменяет текущий доступ к БД и схему миграций.  
`Supabase Auth`, `RLS`, `RPC`, `pg_cron` придется переносить в `NestJS`, `PostgreSQL`, `JWT auth`, `scheduler/worker`.

## 2. Главный Принцип Миграции

Не делать big-bang rewrite.

Правильный путь для этого проекта:

1. Сначала зафиксировать текущее рабочее состояние.
2. Поднять новый backend рядом с текущим проектом.
3. Повторить текущую схему БД в `PostgreSQL + Prisma`.
4. По доменам переносить серверную логику из Supabase в NestJS.
5. Постепенно переключать фронтенд с Supabase на Nest API.
6. Только после этого выключать Supabase.

Самая большая ошибка, которую нельзя делать:

- одновременно переписывать фронтенд, auth, базу, cron и деплой.

## 3. Что Есть Сейчас В Проекте

### 3.1 Текущий стек

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Supabase SSR + Supabase Auth + Supabase Postgres`
- `TanStack Query`
- `Zod`
- `web-push`
- AI через `Yandex` или `Ollama`

Источник в проекте:

- `package.json`
- `src/utils/supabase/*`
- `app/api/*`
- `supabase/migrations/*`
- `types/database.types.ts`

### 3.2 Что сейчас завязано на Supabase

Сейчас Supabase используется в четырех ролях:

1. `Auth`
   - админский логин через `email + password`
   - клиентский кабинет через invite + `email + password`

2. `Database`
   - вся бизнес-логика хранится в PostgreSQL через таблицы `public.*`

3. `RLS / access control`
   - большая часть multi-tenant изоляции держится на `auth.uid() = user_id`

4. `RPC / platform features`
   - `create_feedback_token`
   - `submit_feedback`
   - `cleanup_recommendation_jobs`
   - часть cron-поведения и security definer логики

### 3.3 Ключевые серверные зоны

Текущие route handlers:

- `app/api/clients/route.ts`
- `app/api/categories/route.ts`
- `app/api/services/route.ts`
- `app/api/discounts/route.ts`
- `app/api/discounts/[id]/use/route.ts`
- `app/api/appointments/[id]/complete/route.ts`
- `app/api/feedback/*`
- `app/api/recommendations/*`
- `app/api/client/*`
- `app/api/push/*`

Текущий auth/session слой:

- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `src/utils/supabase/admin.ts`
- `src/utils/supabase/middleware.ts`
- `proxy.ts`

### 3.4 Ключевые таблицы, которые надо перенести

По состоянию текущего проекта в миграции и типах уже есть:

- `appointments`
- `clients`
- `services`
- `categories`
- `discount_rules`
- `client_discounts`
- `feedback_tokens`
- `feedback_responses`
- `recommendation_prompts`
- `recommendation_jobs`
- `ai_recommendations`
- `client_portal_invites`
- `client_portal_profiles`
- `client_portal_links`
- `push_subscriptions`
- `owner_notification_settings`
- `appointment_reminders`

Также сейчас вся логика завязана на том, что владелец бизнеса определяется через `auth.users.id` и хранится в большинстве таблиц как `user_id` или `owner_user_id`.

## 4. Что Должно Стать После Переезда

## 4.1 Целевая архитектура

Рекомендуемая целевая схема:

- `frontend`: текущий `Next.js`
- `backend`: новый `NestJS`
- `ORM`: `Prisma`
- `database`: `PostgreSQL`
- `auth`: собственный `JWT + refresh tokens`
- `jobs/scheduler`: `@nestjs/schedule` на старте, дальше при росте `BullMQ`
- `reverse proxy`: `Nginx`
- `process manager`: `PM2` или `systemd`

### 4.2 Что заменит Supabase

| Сейчас | После миграции |
|---|---|
| Supabase Auth | NestJS Auth Module + PostgreSQL + JWT + refresh tokens |
| Supabase DB | PostgreSQL |
| Supabase JS client | Nest API client / fetch / TanStack Query |
| RLS | backend authorization + service-layer checks |
| RPC functions | Nest services + Prisma transactions |
| pg_cron | Linux cron / Nest scheduler / worker |
| Supabase admin client | Prisma + внутренние сервисы |

## 5. Рекомендуемая Структура Нового Backend

Лучше поднимать отдельный backend рядом с текущим фронтом, а не пытаться сразу запихнуть Nest внутрь существующего Next-приложения.

Рекомендуемая структура:

```text
/mbooking
  /frontend          # текущий Next.js
  /backend           # новый NestJS
  /docs
```

Если monorepo пока делать не хочется, допустим и такой вариант:

```text
/mbooking            # текущий frontend
/mbooking-api        # новый NestJS backend
```

Для Cursor безопаснее второй вариант:

- меньше шанс сломать работающий фронтенд
- проще отделить миграцию
- проще делать cutover поэтапно

## 6. Что Нужно Повторить В Prisma

## 6.1 Базовый принцип

Нужно не изобретать новую схему сразу, а сначала воспроизвести текущую модель почти 1 в 1.

Очень важно:

- сохранять текущие `UUID`
- сохранять текущие связи
- сохранять текущие статусы
- сохранять текущие поля `user_id`, `owner_user_id`
- не переименовывать половину схемы на первом шаге

Сначала цель не "улучшить", а "повторить без потерь".

## 6.2 Какие Prisma-модели понадобятся

Минимальный список моделей:

- `User`
- `AdminSession` или `RefreshToken`
- `ClientAuthUser`
- `ClientPortalInvite`
- `ClientPortalProfile`
- `ClientPortalLink`
- `Client`
- `Category`
- `Service`
- `Appointment`
- `DiscountRule`
- `ClientDiscount`
- `FeedbackToken`
- `FeedbackResponse`
- `RecommendationPrompt`
- `RecommendationJob`
- `AiRecommendation`
- `PushSubscription`
- `OwnerNotificationSettings`
- `AppointmentReminder`

### 6.3 Рекомендация по auth-модели

Чтобы не ломать логику multi-tenant, лучше сделать единый `users`-слой и разделить роли:

- `owner`
- `client_portal`

То есть вместо привязки к `auth.users` сделать свою таблицу вроде:

- `users`
  - `id`
  - `email`
  - `password_hash`
  - `role`
  - `is_active`
  - `created_at`
  - `updated_at`

И дальше:

- бизнес-данные владельца продолжают ссылаться на `users.id`
- клиентский кабинет тоже получает `users.id`, но с ролью `client_portal`

Это лучший путь, потому что:

- он повторяет текущую модель ролей
- упрощает middleware и guards
- избавляет от зависимости на `auth.users`

## 7. Что Из Supabase Надо Перенести Не Как Таблицы, А Как Логику

## 7.1 Auth

Сейчас:

- `/login` использует Supabase email/password
- клиентский кабинет активируется invite-ссылкой
- клиент потом входит через email/password
- роль клиента сейчас живет в `user_metadata.role = client_portal`

После миграции:

- Nest Auth module
- пароль хранить как `argon2 hash`
- access token + refresh token
- middleware/guard по ролям:
  - `owner`
  - `client_portal`

### Нужно реализовать:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /client-auth/login`
- `POST /client-auth/logout`
- `POST /client-auth/activate-invite`
- `POST /client-auth/request-password-reset`
- `POST /client-auth/reset-password`

## 7.2 RLS

Сейчас изоляция данных частично обеспечивается RLS.

После миграции RLS больше не будет главным механизмом.

Это надо перенести в backend-слой:

- каждый owner работает только со своими данными
- каждый клиент кабинета работает только со своими ссылками и своими данными

Значит во всех Nest services нужны явные проверки:

- `where: { userId: currentUser.id }`
- или `where: { ownerUserId: currentUser.id }`

И в клиентском кабинете:

- разрешать доступ только к данным из `client_portal_links`

## 7.3 RPC функции

Сейчас есть минимум три важных SQL/RPC зоны:

1. `create_feedback_token`
2. `submit_feedback`
3. `cleanup_recommendation_jobs`

После миграции:

- это должны быть обычные Nest services
- где нужно, использовать `Prisma.$transaction()`

### Как переносить

#### `create_feedback_token`

Сейчас:

- генерирует токен
- привязывает к appointment
- контролирует срок действия

После:

- `FeedbackService.createToken(appointmentId, ownerId)`
- генерация токена в backend
- сохранение в `feedback_tokens`

#### `submit_feedback`

Сейчас:

- валидирует feedback token
- создает `feedback_response`
- помечает token как used
- при новых миграциях еще и создает discount по итогам отзыва

После:

- `FeedbackPublicService.submitFeedback(token, payload)`
- делается внутри одной транзакции

Псевдо-шаги:

1. найти активный token
2. проверить `expires_at`, `used_at`
3. создать `feedback_response`
4. деактивировать token
5. если бизнес-правило требует - создать `client_discount`

#### `cleanup_recommendation_jobs`

Сейчас:

- SQL function + `pg_cron`

После:

- `RecommendationsCleanupService.cleanupOldJobs()`
- запуск через:
  - `@nestjs/schedule`
  - или Linux `cron`
  - или worker

## 7.4 Push / reminders

Сейчас:

- подписки хранятся в `push_subscriptions`
- owner settings в `owner_notification_settings`
- scheduled reminders в `appointment_reminders`
- часть event push уже в Next route handlers

После:

- перенести в `NotificationsModule`
- использовать тот же `web-push`
- scheduled dispatch делать из backend worker/cron

На Timeweb это будет проще, чем на Vercel Hobby, потому что можно дергать задачу хоть каждую минуту.

## 8. Порядок Переноса По Доменам

Правильный порядок для этого проекта:

### Этап 1. Auth и users

Нужно сделать:

- новую таблицу `users`
- JWT auth для owner
- JWT auth для client portal
- refresh tokens
- guards

Цель этапа:

- убрать зависимость от `supabase.auth`

### Этап 2. Справочники

Перенести:

- `clients`
- `categories`
- `services`

Сделать Nest-модули:

- `ClientsModule`
- `CategoriesModule`
- `ServicesModule`

Цель этапа:

- получить первый устойчивый CRUD без Supabase

### Этап 3. Appointments

Перенести:

- список записей
- создание записи
- редактирование записи
- отмену записи
- завершение записи

Особенно важно повторить:

- логику скидки на услугу
- логику feedback token при завершении визита
- логику напоминаний

### Этап 4. Discounts

Перенести:

- `discount_rules`
- `client_discounts`
- reserve/use flows
- service-scoped discount logic

### Этап 5. Feedback

Перенести:

- публичную форму отзыва
- feedback token validate
- submit feedback
- автосоздание скидки за отзыв

Это отдельный критический модуль, потому что он связан и с публичным API, и с discount flow.

### Этап 6. Client portal

Перенести:

- invites
- activation
- login
- profile
- links
- appointments view
- discounts view
- settings

### Этап 7. Recommendations / AI

Перенести:

- `recommendation_prompts`
- `recommendation_jobs`
- `ai_recommendations`
- запуск LLM
- cleanup старых jobs

### Этап 8. Notifications

Перенести:

- push subscriptions
- owner notification settings
- appointment reminders
- dispatch jobs
- event push

## 9. Пошаговый План Миграции

## Фаза 0. Подготовка

Задачи:

- зафиксировать текущий рабочий `main`
- обновить `docs/ARCHITECTURE.md`
- сделать свежий экспорт схемы Supabase
- убедиться, что все миграции в `supabase/migrations` актуальны
- не начинать перенос, пока нет полной карты сущностей

Результат:

- есть точный inventory текущей системы

## Фаза 1. Новый backend skeleton

Нужно создать новый backend:

- `NestJS`
- `Prisma`
- `PostgreSQL`
- `ConfigModule`
- `AuthModule`
- `UsersModule`
- `HealthModule`

Обязательные пакеты:

- `@nestjs/config`
- `@nestjs/jwt`
- `@nestjs/passport`
- `passport-jwt`
- `class-validator`
- `class-transformer`
- `argon2`
- `prisma`
- `@prisma/client`

Опционально сразу:

- `@nestjs/schedule`
- `bullmq`
- `ioredis`
- `@nestjs/swagger`

Результат:

- backend поднимается отдельно
- healthcheck работает
- Prisma подключена к новой PostgreSQL

## Фаза 2. Повторение схемы БД в Prisma

Задачи:

- перенести текущую public-схему в `schema.prisma`
- сохранить `UUID`
- добавить indexes и unique constraints
- сохранить nullable/non-nullable поведение

Очень важно:

- не пытаться оптимизировать схему на этом этапе
- не переименовывать половину полей
- не смешивать migration и refactor

Результат:

- новая Postgres БД по структуре повторяет текущую бизнес-схему

## Фаза 3. Миграция данных

Задачи:

- выгрузить данные из Supabase/Postgres
- загрузить в новую Postgres
- сохранить первичные ключи
- сохранить временные метки

Рекомендуемый порядок импорта:

1. `users`
2. `categories`
3. `services`
4. `clients`
5. `discount_rules`
6. `appointments`
7. `feedback_tokens`
8. `feedback_responses`
9. `client_discounts`
10. `recommendation_prompts`
11. `ai_recommendations`
12. `recommendation_jobs`
13. `client_portal_profiles`
14. `client_portal_invites`
15. `client_portal_links`
16. `push_subscriptions`
17. `owner_notification_settings`
18. `appointment_reminders`

Результат:

- новая база содержит копию production-данных

## Фаза 4. Auth cut-in

Задачи:

- реализовать owner login в Nest
- реализовать client portal login в Nest
- реализовать invite activation в Nest
- реализовать refresh flow

На этом этапе фронтенд еще можно оставить в Next.js, но auth уже дергать через новый backend.

Результат:

- Supabase Auth больше не обязателен для логина

## Фаза 5. CRUD cut-in по доменам

Двигаться строго по доменам:

1. clients
2. categories
3. services
4. appointments
5. discounts
6. feedback
7. client portal
8. recommendations
9. notifications

Для каждого домена:

1. сделать Nest controller/service
2. сделать DTO
3. сделать Prisma queries
4. переключить фронт на новый endpoint
5. убедиться, что старый Supabase код больше не нужен

Результат:

- фронтенд по частям перестает ходить в Supabase

## Фаза 6. Cutover и decommission

Когда все домены уже работают через Nest:

- убрать Supabase client из frontend
- убрать `src/utils/supabase/*`
- убрать middleware на Supabase session
- убрать Supabase env
- убрать SQL/RPC зависимости
- перевести деплой на Timeweb

## 10. Как Переносить Фронтенд

Не надо переписывать весь фронт.

Правильный путь:

- сохраняем `Next.js` UI как есть
- меняем только data layer

То есть:

- `src/api/*` постепенно переводим с Supabase/Next route handlers на запросы в Nest API
- `src/hooks/*` оставляем
- `components/*` стараемся не трогать без необходимости

Это сильно уменьшит риск.

## 11. Что Делать С Текущими Next Route Handlers

Сейчас у вас очень много бизнес-логики сидит в `app/api/*`.

Нельзя переносить это хаотично.

Правильный подход:

- каждый `app/api/*` сначала сопоставить с будущим Nest endpoint
- потом вынести бизнес-логику в Nest service
- затем переключить фронт на новый endpoint
- только после этого удалять старый route

### Пример маппинга

| Текущий route | Будущий Nest endpoint |
|---|---|
| `GET /api/clients` | `GET /v1/clients` |
| `POST /api/clients` | `POST /v1/clients` |
| `GET /api/services` | `GET /v1/services` |
| `GET /api/categories` | `GET /v1/categories` |
| `POST /api/discounts` | `POST /v1/discounts` |
| `POST /api/feedback/submit` | `POST /v1/public/feedback/submit` |
| `POST /api/feedback/token` | `POST /v1/feedback/tokens` |
| `POST /api/client/invitations` | `POST /v1/client-portal/invitations` |
| `POST /api/push/subscribe` | `POST /v1/push/subscriptions` |
| `POST /api/push/reminders/dispatch` | `POST /v1/internal/push/reminders/dispatch` |

## 12. Что Делать С Телефонами

В проекте уже есть нормализация телефонов, и это важно сохранить.

Ключевые правила:

- телефон должен храниться в одном normalized формате
- сравнение клиентов и скидок должно идти по normalized phone
- invite/client portal links тоже должны жить в normalized формате

После миграции:

- вынести текущую логику `normalizePhone` в backend utility
- не полагаться на raw string from frontend

## 13. Что Делать С Recommendation Jobs

Сейчас AI-рекомендации уже оформлены как job-модель:

- `recommendation_jobs`
- `ai_recommendations`
- `recommendation_prompts`

Это хороший кандидат на worker architecture.

Минимальный вариант:

- оставить synchronous/manual run, как сейчас

Лучший вариант после миграции:

- `BullMQ`
- отдельный worker process
- retry logic
- cleanup старых job

Но не надо делать это в первой фазе миграции.

Сначала просто повторить текущую рабочую логику.

## 14. Что Делать С Push И Reminders

Сейчас у проекта уже есть:

- `push_subscriptions`
- `owner_notification_settings`
- `appointment_reminders`
- event push
- scheduled reminders

После переезда на Timeweb лучше всего:

- dispatch reminders запускать через Linux cron каждую минуту
- или через `@nestjs/schedule`
- при росте перейти на очередь

Рекомендуемый MVP после переезда:

- `POST /internal/push/reminders/dispatch`
- cron вызывает endpoint каждую минуту

Позже можно заменить на worker без HTTP.

## 15. Что Делать С Клиентским Кабинетом

Клиентский кабинет уже работает как MVP.

Это значит, что при переносе надо сохранить:

- invite flow
- hashed invite tokens
- email/password login
- связь клиента с owner через `client_portal_links`
- просмотр записей
- просмотр скидок
- настройки клиента

После миграции:

- клиентский кабинет не должен зависеть от owner auth-сессии
- публичные invite routes должны остаться отдельными
- protected client routes должны использовать отдельный role guard

## 16. Как Развернуть На Timeweb

## 16.1 Базовая схема сервера

На старте достаточно одного `Timeweb Cloud Server`:

- `Ubuntu LTS`
- `Node.js LTS`
- `PostgreSQL`
- `Nginx`
- `PM2`

Позже можно вынести БД отдельно.

## 16.2 Базовый runtime план

На сервере должны жить:

- `frontend` Next.js
- `backend` NestJS
- `postgresql`
- `nginx`

Опционально:

- `redis`

## 16.3 Nginx routing

Пример логики:

- `https://your-domain.com/` -> `frontend`
- `https://your-domain.com/api/` -> либо `frontend API`, либо сразу `backend`
- лучше в новой архитектуре выделить backend, например:
  - `https://api.your-domain.com/` -> `NestJS`

Рекомендуемый production вариант:

- `app.domain.com` -> Next.js
- `api.domain.com` -> NestJS

## 16.4 Что нужно на сервере

Минимум:

- `git`
- `node`
- `npm` или `pnpm`
- `postgresql`
- `nginx`
- `pm2`
- `certbot`

## 16.5 Что заменить из Vercel-логики

С Vercel надо будет убрать:

- зависимость от `vercel.json`
- зависимость от Vercel cron
- специфичные deployment assumptions

И заменить на:

- `Nginx`
- `PM2`
- `systemd` или `cron`

## 17. Риски Миграции

Главные риски:

1. Одновременная смена auth и data layer
2. Потеря UUID и связей при импорте
3. Поломка client portal links
4. Неправильный перенос логики скидок
5. Неправильный перенос feedback token flow
6. Поломка multi-tenant изоляции после отказа от RLS

Самая критичная зона:

- не база как таковая
- а бизнес-правила внутри `appointments`, `client_discounts`, `feedback_tokens`, `client_portal_*`

## 18. Что Нельзя Делать Cursor Во Время Миграции

Нельзя:

- сразу удалять Supabase код
- сразу удалять миграции Supabase
- менять UUID на auto-increment ids
- переименовывать все поля одновременно
- переносить auth последним
- переносить reminders и push без тестов

Нужно:

- работать малыми фазами
- после каждой фазы прогонять smoke test
- держать rollback план

## 19. Чеклист Для Cursor AI

### Блок A. Инвентаризация

- собрать все таблицы из `types/database.types.ts`
- собрать все SQL функции из `supabase/migrations`
- собрать все route handlers из `app/api`
- собрать все места прямого Supabase usage из:
  - `src/utils/supabase/*`
  - `src/server/*`
  - `src/api/*`
  - `components/ClientPortal/*`

### Блок B. Новый backend

- создать `NestJS` проект
- подключить `Prisma`
- подключить `ConfigModule`
- подключить `JWT auth`
- создать базовый `UsersModule`

### Блок C. Prisma schema

- описать models по текущей схеме
- сохранить UUID
- сохранить indexes
- сохранить unique constraints
- описать enums, если будут выделены

### Блок D. Data migration

- подготовить export strategy
- подготовить import scripts
- импортировать данные в staging DB
- проверить counts и foreign keys

### Блок E. Auth migration

- owner login
- client portal login
- invites
- activate invite
- reset password
- refresh tokens

### Блок F. Domain migration

- clients
- categories
- services
- appointments
- discounts
- feedback
- client portal
- recommendations
- push

### Блок G. Frontend cutover

- переписать `src/api/*` на Nest endpoints
- убрать Supabase client зависимости
- переписать auth flows
- переписать middleware

### Блок H. Infra

- поднять Timeweb server
- настроить PostgreSQL
- настроить Nginx
- настроить PM2
- настроить SSL
- настроить cron

### Блок I. Final cutover

- переключить env на новый backend/db
- выполнить smoke test
- зафиксировать rollback plan
- только потом выключать Supabase

## 20. Рекомендуемый Порядок Реальной Работы

Самый безопасный реальный порядок именно для этого проекта:

1. Создать подробный inventory текущего Supabase usage.
2. Создать новый Nest backend.
3. Повторить текущую схему в Prisma.
4. Поднять новый PostgreSQL.
5. Перенести auth.
6. Перенести clients/categories/services.
7. Перенести appointments.
8. Перенести discounts.
9. Перенести feedback.
10. Перенести client portal.
11. Перенести push/reminders.
12. Перенести recommendations.
13. Переключить frontend.
14. Развернуть на Timeweb.
15. Отключить Supabase.

## 21. Практическая Рекомендация

Для этого проекта лучший путь не "переписать все на Nest за раз", а:

- оставить `Next.js` как UI
- вынести backend в `NestJS`
- использовать `Prisma + PostgreSQL`
- делать migration domain-by-domain

Так вы:

- не потеряете рабочий продукт
- не сломаете клиентский кабинет
- не потеряете сложную логику скидок и feedback
- сможете перенести проект на Timeweb без паники

## 22. Источники Для Реализации

Официальные документы, на которые стоит опираться при переносе:

- NestJS recipes: `https://docs.nestjs.com/recipes`
- Prisma migrate/data migration: `https://www.prisma.io/docs/guides/database/data-migration`
- Timeweb Cloud Servers docs: `https://timeweb.cloud/docs/cloud-servers`
- Timeweb server start: `https://timeweb.cloud/docs/cloud-servers/servers-start`
- Nginx proxy module: `https://nginx.org/en/docs/http/ngx_http_proxy_module.html`
- PostgreSQL backup/restore docs: `https://www.postgresql.org/docs/current/app-pgdump.html`

## 23. Что Делать Следующим Сообщением

Следующий логичный документ после этого:

- отдельная `migration inventory` карта
- или черновой `schema.prisma`
- или `backend architecture map` по модулям Nest

Лучший следующий шаг:

- сначала сделать `полный inventory Supabase -> Nest/Prisma mapping`
- и только потом начинать генерацию backend.
