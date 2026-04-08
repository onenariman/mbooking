# 02. Supabase Inventory Map

## Зачем этот документ

Этот файл нужен, чтобы точно понимать, что именно сейчас завязано на Supabase и что потом придется заменить.

Без такого inventory миграция почти всегда ломается на скрытых местах:

- auth cookies
- RPC
- RLS
- server/admin clients
- public flows
- cron-like задачи

## 1. Где в проекте сидит Supabase

### Базовый слой

- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `src/utils/supabase/admin.ts`
- `src/utils/supabase/env.ts`
- `src/utils/supabase/middleware.ts`
- `proxy.ts`

Назначение:

- browser client
- server client
- admin/service-role client
- SSR cookies/session
- route protection

### Auth flows

Owner auth:

- `app/login/action.ts`

Client portal auth:

- `components/ClientPortal/ClientLoginForm.tsx`
- `components/ClientPortal/ClientInviteActivationForm.tsx`
- `components/ClientPortal/ClientLogoutButton.tsx`
- `src/server/client-portal/invitations.ts`
- `src/server/client-portal/context.ts`

Сейчас используется:

- Supabase email/password auth
- Supabase session cookies
- `user_metadata.role = client_portal`

### Route handlers

Сейчас Supabase участвует в:

- `app/api/clients/route.ts`
- `app/api/categories/route.ts`
- `app/api/services/route.ts`
- `app/api/discounts/route.ts`
- `app/api/discounts/[id]/use/route.ts`
- `app/api/appointments/[id]/complete/route.ts`
- `app/api/feedback/*`
- `app/api/client/*`
- `app/api/push/*`
- `app/api/recommendations/*`
- `app/api/charts/overview/route.ts`

## 2. Таблицы, которые реально используются

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

## 3. SQL/RPC и platform-specific pieces

### RPC функции

- `create_feedback_token`
- `submit_feedback`

Точки входа:

- `app/api/feedback/token/route.ts`
- `app/api/feedback/submit/route.ts`
- `app/api/appointments/[id]/complete/route.ts`

### Cleanup logic

- `cleanup_recommendation_jobs`
- `supabase/migrations/20260316173000_cleanup_recommendation_jobs.sql`

### RLS

Сейчас защита строится вокруг:

- `auth.uid() = user_id`
- `auth.uid() = owner_user_id`

После миграции это надо заменить на:

- auth guards
- service-layer filtering
- ownership checks

## 4. Прямое использование Supabase client на фронте

Главная чувствительная зона:

- `src/api/receptions.api.ts`

Там еще остается логика, которая напрямую опирается на browser Supabase client.

Это значит:

- appointments миграция будет одной из самых рискованных частей;
- transport лучше переписывать там особенно аккуратно.

Также Supabase client сейчас участвует в:

- logout flows
- client portal login
- invite activation

## 5. Auth inventory

### Owner auth

Сейчас:

- email + password
- Supabase session cookies
- middleware проверяет user через Supabase SSR

После:

- JWT access token
- refresh tokens
- backend session policy

### Client portal auth

Сейчас:

- invite создается сервером
- activation использует email/password
- user получает роль `client_portal`
- protected `/client/*` маршруты разделяются через middleware

После:

- отдельный client auth flow в Nest
- role guard `client_portal`
- invite activation через backend transaction

## 6. Доменная карта

### Clients

Сейчас:

- `clients`
- `app/api/clients/route.ts`

После:

- `ClientsModule`

### Categories

Сейчас:

- `categories`
- `app/api/categories/route.ts`

После:

- `CategoriesModule`

### Services

Сейчас:

- `services`
- `app/api/services/route.ts`

После:

- `ServicesModule`

### Appointments

Сейчас:

- `appointments`
- `src/api/receptions.api.ts`
- `app/api/appointments/[id]/complete/route.ts`
- `app/api/push/appointments/event/route.ts`
- `app/api/push/reminders/sync/route.ts`

После:

- `AppointmentsModule`

### Discounts

Сейчас:

- `discount_rules`
- `client_discounts`
- `app/api/discounts/*`

После:

- `DiscountsModule`

### Feedback

Сейчас:

- `feedback_tokens`
- `feedback_responses`
- SQL RPC + public submit flow

После:

- `FeedbackModule`

### Client portal

Сейчас:

- `client_portal_invites`
- `client_portal_profiles`
- `client_portal_links`
- `src/server/client-portal/*`

После:

- `ClientPortalModule`

### Push / reminders

Сейчас:

- `push_subscriptions`
- `owner_notification_settings`
- `appointment_reminders`
- `src/server/push/*`

После:

- `NotificationsModule`

### Recommendations

Сейчас:

- `recommendation_prompts`
- `recommendation_jobs`
- `ai_recommendations`
- `app/api/recommendations/*`

После:

- `RecommendationsModule`

## 7. Места с повышенным риском

- `appointments`
- `client_discounts`
- `feedback_tokens`
- `submit_feedback`
- `client_portal_links`
- `middleware role separation`
- `push/reminders`

Их нельзя переносить "одним махом" без поэтапной проверки.

## 8. Вывод

Supabase в проекте сейчас отвечает не только за базу, но и за:

- auth
- session
- ownership
- public RPC
- admin operations
- scheduler pieces

Поэтому миграция должна идти как перенос платформенных обязанностей в Nest backend, а не просто как перенос таблиц.
