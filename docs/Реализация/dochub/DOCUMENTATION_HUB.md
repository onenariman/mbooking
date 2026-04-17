# Mbooking — Documentation Hub

Единая точка входа в документацию репозитория. Если ты впервые в проекте — начинай отсюда.

## Быстрые ссылки (что читать в каком порядке)

- **Архитектура (source of truth)**: `docs/ARCHITECTURE.md`
- **Что осталось сделать (актуальные next steps)**: `docs/ROADMAP.md`
- **Карта продукта / контекста**: `docs/APPLICATION_FULL_MAP.md`
- **Master plan (монетизация + trial + lessons + quotas)**: `docs/Реализация/IMPLEMENTATION_MASTER_PLAN.md`
- **Backend implementation plan (billing/lessons/quota)**: `docs/Реализация/BACKEND_IMPLEMENTATION_PLAN.md`
- **Яндекс OAuth (owner)**: `docs/Реализация/yandexouth.md`
- **Multi-staff**: `docs/MULTI_STAFF_IMPLEMENTATION_PLAN.md`
- **Подписки (провайдеры)**:
  - `docs/YOOKASSA_SUBSCRIPTION_IMPLEMENTATION_PLAN.md`
  - `docs/YOOKASSA_SUBSCRIPTION_IMPLEMENTATION_PLAN_V2.md`
  - `docs/YANDEX_PAY_SUBSCRIPTION_IMPLEMENTATION_PLAN.md`

---

## Структура репозитория (куда смотреть)

### `backend/` (NestJS + Prisma) — главный источник бизнес-логики

- **Точка входа приложения**: `backend/src/main.ts` (CORS, глобальные pipes/filters, prefix `/v1`)
- **Сборка модулей**: `backend/src/app.module.ts`
- **Prisma**:
  - схема: `backend/prisma/schema.prisma`
  - миграции: `backend/prisma/migrations/*`
  - seed: `backend/prisma/seed.ts`

**Доменные модули (Nest)** — смотри `backend/src/modules/*`:

- `auth` — owner auth (login/refresh/logout/me), плюс OAuth Яндекс (если включено)
- `client-portal` — приглашения/активация + auth клиента и API кабинета
- `appointments` — записи
- `clients` — клиентская база
- `services`, `categories` — каталог услуг
- `discounts` — скидки
- `feedback` — отзывы
- `push` — push подписки и напоминания (sync/dispatch)
- `recommendations` — AI рекомендации

### `app/` (Next.js App Router) — страницы, route handlers, BFF

- **Owner pages**: `/receptions`, `/clients`, `/services`, `/categories`, `/charts`, `/recommendations/*`
- **Auth pages**: `/login`, `/register` (в проде регистрация может быть отключена конфигом)
- **Client portal pages**:
  - публичные: `/client/login`, `/client/invite/[token]`
  - защищённые: `/client`, `/client/appointments`, `/client/discounts`, `/client/settings`

### `src/` (frontend infra) — transport, session, api, hooks

- **BFF forwarder в Nest**: `src/server/nest-v1-forward.ts`
- **Owner transport**: запросы в Nest через Next route handler `/api/nest-v1/*` (`app/api/nest-v1/[...path]/route.ts`)
- **Client transport**: запросы в Nest через `/api/nest-v1-client/*` (аналогичный catch-all)
- **API wrappers**: `src/api/*`
- **TanStack Query hooks**: `src/hooks/*`
- **Session/cookies**: `src/server/nest-session*.ts`, `src/server/owner-session-cookies.ts`

### `client/` (выделенный слой client portal)

- `client/actions/*` — server actions для flow’ов (например активация invite)
- `client/components/*` — формы/экраны кабинета клиента
- `client/server/context.ts` — SSR-контекст клиентской сессии/загрузки данных

### `components/` (UI + feature components)

- layout/оболочка: `components/layout/AppShell.tsx`
- auth UI: `components/auth/*`
- графики: `components/Charts/*`
- прочие feature блоки owner-зоны

---

## Как устроен transport (BFF) и авторизация

### Две независимые сессии

Сейчас в проекте две separate httpOnly-cookie сессии (owner и client portal):

- **owner cookies**: `mbooking_owner_access`, `mbooking_owner_refresh`
- **client portal cookies**: `mbooking_client_portal_access`, `mbooking_client_portal_refresh`

Access token — JWT; refresh — opaque string, в БД хранится только hash.

### Forwarding запросов в Nest

Owner-запросы идут так:

`src/api/*` → `app/api/nest-v1/[...path]` → `src/server/nest-v1-forward.ts` → `backend` (`/v1/*`)

В `forwardNestV1Request(...)`:

- токен берётся из cookie-сессии;
- в Nest прокидывается `Authorization: Bearer <access>`;
- при необходимости обновления сессии Next-ответ получает обновлённые cookies.

---

## Быстрый старт (локальная разработка)

### 1) Frontend (Next)

В корне репо:

- `npm i`
- `npm run dev` (Next dev server)

### 2) Backend (Nest)

В `backend/`:

- `npm i`
- `npm run prisma:generate`
- `npm run start:dev`

### 3) База данных и миграции

Схема и миграции — `backend/prisma/*`. Seed определяется в `backend/package.json`:

- `npm run db:seed`

---

## Окружение (самое важное)

### Next (frontend)

См. `docs/ARCHITECTURE.md`, раздел про env. Ключевые:

- `NEST_API_INTERNAL_URL` — URL Nest для server-side вызовов (например `http://localhost:4000`)
- `NEXT_PUBLIC_NEST_API_URL` — fallback / dev
- `NEST_JWT_ACCESS_SECRET` — должен совпадать с `JWT_ACCESS_SECRET` на стороне Nest
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — браузерная часть push

### Nest (backend)

Полный список — в `backend/src/config/env.schema.ts` и примерах в `backend/.env.example` (если есть в репо).

---

## Где править “что именно”

- **Добавить/изменить бизнес-логику**: `backend/src/modules/<domain>/*`
- **Изменить модель данных**: `backend/prisma/schema.prisma` + новая миграция
- **Изменить BFF/transport**: `src/server/nest-v1-forward.ts` и route handlers в `app/api/*`
- **Изменить owner UI**: `app/*` страницы + `components/*`
- **Изменить client portal UI**: `app/client/*` + `client/*`
- **Добавить новые запросы на фронте**: `src/api/*` + `src/hooks/*`

---

## Частые задачи (навигация по фичам)

- **Client portal invite/activation**: `backend/src/modules/client-portal/*` + `app/client/(public)/invite/[token]/*` + `client/actions/activate-invite.ts`
- **Напоминания**:
  - sync: `backend/src/modules/push/appointment-reminders-sync.service.ts`
  - dispatch: `backend/src/modules/push/appointment-reminder-dispatch.service.ts`
  - cron entrypoint: `backend/src/modules/push/reminders-dispatch.cron.ts`
- **Recommendations**: `backend/src/modules/recommendations/*` + страницы `app/recommendations/*`
- **Charts**: `app/api/charts/overview/route.ts` + `components/Charts/*`

