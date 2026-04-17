# Архитектура проекта Mbooking

Документ описывает текущее рабочее состояние проекта после миграции owner-части и клиентского кабинета на Nest + Prisma.

## 1) Стек
- Next.js 16 (App Router, `proxy.ts`).
- React, TypeScript, TanStack Query, Zod.
- NestJS в `backend/`.
- Prisma + PostgreSQL.
- UI: shadcn/ui, Recharts.

## 2) Структура репозитория
- `app/` — страницы, server actions и route handlers фронтенда.
- `components/` — UI и feature-компоненты.
- `src/api/` — клиентские API-обёртки поверх same-origin BFF.
- `src/server/` — server-side helper'ы для Nest, cookie/session logic, SSR context.
- `backend/src/` — NestJS модули, контроллеры, guards, DTO, Prisma service.
- `backend/prisma/` — Prisma schema, seed и миграционная логика backend.
- `docs/` — документация проекта (старт: `docs/DOCUMENTATION_HUB.md`).

## 3) Маршруты
- `/` и `/login` — вход мастера.
- `/register` — регистрация мастера, если она не отключена env-конфигом.
- `/receptions`, `/clients`, `/services`, `/categories`, `/charts`, `/recommendations/*` — owner-зона.
- `/client/login` и `/client/invite/[token]` — публичные entry points клиентского кабинета.
- `/client`, `/client/appointments`, `/client/discounts`, `/client/settings` — protected client portal.
- `/feedback/[token]` — публичная feedback-форма.

## 4) Auth и сессии
- Есть две независимые httpOnly-сессии:
  - owner: `mbooking_owner_access`, `mbooking_owner_refresh`
  - client portal: `mbooking_client_portal_access`, `mbooking_client_portal_refresh`
- Access token — JWT Nest с `type: "access"`.
- Refresh token — opaque string, хранится в БД только как hash.
- `proxy.ts` на Next 16 разделяет owner/client маршруты, делает redirect по роли и умеет обновлять access через refresh-cookie.
- Owner-страницы дополнительно защищены server-side helper'ом, чтобы не зависеть только от edge-периметра.

## 5) Фронтендовый transport
- Авторизованные запросы owner идут через `/api/nest-v1/*`.
- Авторизованные запросы client portal идут через `/api/nest-v1-client/*`.
- Общий BFF-прокси находится в `src/server/nest-v1-forward.ts`.
- Публичные браузерные вызовы к Nest выполняются через `nestPublicV1Fetch(...)` и требуют `NEXT_PUBLIC_NEST_API_URL`.
- Токены не хранятся в `localStorage` в основном runtime flow.

## 6) Backend
- `backend/src/modules/auth/` — register, login, refresh, logout, me.
- `backend/src/modules/client-portal/` — invite/activate + client portal API.
- `backend/src/modules/appointments/`, `clients/`, `categories/`, `services/`, `discounts/`, `feedback/`, `push/`, `recommendations/` — доменные модули.
- Публичные auth/invite endpoints дополнительно ограничены rate limiting через `@nestjs/throttler`.

## 7) Данные и BFF
- Owner UI работает через `src/api/*` → same-origin BFF → Nest `/v1/*`.
- Client portal SSR использует server-side context из `client/server/context.ts` (код кабинета сгруппирован в папке `client/` рядом с `backend/`).
- `app/api/charts/overview` остаётся фронтовым route handler'ом, но данные получает из Nest по owner-сессии.

## 8) Источник правды
- Архитектура: этот файл.
- Что осталось сделать: `docs/ROADMAP.md`.

## 11) Диагностика и DevTools
`components/layout/AppShell.tsx` подключает:
- `TanstackProvider`
- `Devtools`
- `Toaster`

## 12) Миграции (важные)
- `20260223120000_prevent_appointments_overlap.sql` — уникальность слота.
- `20260310120000_add_feedback_scores.sql` — рейтинги в отзывах.
- `20260311120000_create_rls_policies.sql` — базовые RLS.
- `20260312123000_hardening_policies_and_appointments.sql` — усиление политик/слотов.
- `20260316170000_create_recommendation_jobs.sql` — очередь рекомендаций.
- `20260316171000_limit_feedback_length.sql` — лимит текста отзыва.
- `20260316173000_cleanup_recommendation_jobs.sql` — cron-очистка.
- `20260316174000_appointments_slot_model.sql` — упрощение модели слота, удаление архивирования.

## 13) Переменные окружения (Next)
- `NEST_API_INTERNAL_URL` — URL Nest для server-side (например `http://localhost:4000`)
- `NEXT_PUBLIC_NEST_API_URL` — fallback / dev
- `NEST_JWT_ACCESS_SECRET` — тот же секрет, что `JWT_ACCESS_SECRET` в Nest
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — для push-подписок в браузере

Переменные Nest — в `backend/.env.example`.
