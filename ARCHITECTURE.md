# Архитектура проекта Mbooking

Документ отражает текущее состояние кода и базы. Предназначен для передачи разработчику для аудита и рекомендаций.

## 1) Стек и основные технологии
- Next.js 16 (App Router).
- React, TypeScript.
- Supabase (PostgreSQL + Auth + RLS).
- TanStack Query.
- Zod (валидации и схемы DTO).
- UI: shadcn/ui + Recharts.
- AI: Ollama или YandexGPT (по `AI_PROVIDER`).

## 2) Структура репозитория
- `app/` — страницы и route handlers.
- `components/` — UI и фичи по доменам (Reception, Clients, Services, Categories, Charts, Recommendations, Feedback).
- `src/api/` — тонкие API-функции на клиенте.
- `src/hooks/` — TanStack Query хуки поверх `src/api`.
- `src/schemas/` и `src/validators/` — Zod-схемы.
- `src/utils/supabase/` — клиент Supabase (browser/server) и middleware.
- `supabase/migrations/` — SQL-миграции.
- `types/database.types.ts` — автогенерируемые типы БД.

## 3) Навигация и маршруты
Основные страницы:
- `/` → редирект на `/receptions`.
- `/login` — логин (server action).
- `/receptions` — записи на приём.
- `/clients`, `/services`, `/categories` — справочники.
- `/charts` — аналитика.
- `/recommendations` + подстраницы — AI-рекомендации.
- `/feedback/[token]` — публичная форма отзывов.

## 4) Аутентификация и доступ
- Корневой `proxy.ts` включает Supabase SSR сессию и редиректы.
- `src/utils/supabase/middleware.ts`:
  - если нет пользователя и путь не `/login` и не `/feedback/*` → редирект на `/login`.
  - если пользователь есть и путь `/login` → редирект на `/`.
- Публичный маршрут: `/feedback/[token]`.

## 5) Клиентский слой данных
Схема потока:
`components` → `hooks` (TanStack Query) → `src/api/*` → Supabase/Route Handlers.

Кэширование:
`src/lib/queryConfig.ts` определяет `staleTime` для reference/live/analytics/feedback/recommendations.

Ошибки:
`src/helpers/getErrorMessage.ts` — mapSupabaseError, mapLlmError, getErrorMessage.

## 6) Серверные API (Route Handlers)
Справочники (CRUD, валидируются Zod):
- `GET/POST/PATCH/DELETE /api/clients`
- `GET/POST/PATCH/DELETE /api/services`
- `GET/POST/PATCH/DELETE /api/categories`

Аналитика:
- `GET /api/charts/overview` — агрегаты для `/charts` (appointments, clients, revenue).

Отзывы:
- `POST /api/feedback/token` — генерация токена (RPC `create_feedback_token`).
- `POST /api/feedback/submit` — отправка отзыва (RPC `submit_feedback`).
- `GET /api/feedback/responses` — список отзывов за период.
- `GET /api/feedback/ratings` — агрегированные рейтинги.

Рекомендации:
- `GET /api/recommendations` — список рекомендаций.
- `DELETE /api/recommendations?id=...` — удалить рекомендацию.
- `POST /api/recommendations/jobs` — создать задачу генерации.
- `GET /api/recommendations/jobs/:id` — получить статус.
- `POST /api/recommendations/jobs/:id/run` — выполнить задачу.
- `POST /api/recommendations/generate` — алиас на создание задачи.

## 7) Supabase: таблицы и RLS
Ключевые таблицы:
- `appointments` — записи, привязаны к `user_id`.
- `clients` — клиенты, `user_id`.
- `services` — услуги, `user_id`.
- `categories` — категории, `user_id`.
- `feedback_tokens` — одноразовые токены.
- `feedback_responses` — отзывы.
- `ai_recommendations` — сохранённые рекомендации.
- `recommendation_jobs` — очередь генерации.

RLS:
- Включён на всех таблицах.
- Политики вида `auth.uid() = user_id`, роли `authenticated`.

RPC:
- `create_feedback_token(expires_in)` — выдача токена.
- `submit_feedback(...)` — запись отзыва.
- `cleanup_recommendation_jobs(interval)` — автоочистка очереди.

## 8) Ограничения и инварианты БД
- Уникальность слота в `appointments`: `(user_id, appointment_at, service_name)`.
- Ограничение длины `feedback_text`: 1000 символов (проверка на уровне функции).
- Рекомендации и отзывы всегда хранят `user_id` (мульти‑тенант).

## 9) AI-рекомендации (флоу)
1. Клиент создаёт job через `/api/recommendations/jobs`.
2. Клиент запускает выполнение через `/api/recommendations/jobs/:id/run`.
3. Сервер:
   - выгружает отзывы за период,
   - строит промпт (`src/server/recommendations.ts`),
   - вызывает LLM (Ollama/Yandex),
   - сохраняет результат в `ai_recommendations`,
   - обновляет `recommendation_jobs` (status + метрики).

Ограничения:
- `MAX_FEEDBACK_ITEMS = 10`
- `MAX_FEEDBACK_CHARS = 1000`
- `MIN_FEEDBACK_COUNT = 3`

Очистка:
- `cleanup_recommendation_jobs('30 days')` запускается через `pg_cron`.

## 10) Аналитика
`/api/charts/overview` выполняет агрегаты на сервере и отдаёт готовые серии.
Клиент не делает тяжёлых расчётов.

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

## 13) Переменные окружения
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `AI_PROVIDER=ollama|yandex`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- `YANDEX_FOLDER_ID`, `YANDEX_MODEL_URI`, `YANDEX_IAM_TOKEN` или `YANDEX_API_KEY`

## 14) Вопросы для ревью (что стоит обсудить)
- Нужен ли фоновой воркер/cron для авто‑выполнения recommendation_jobs без участия клиента.
- Нужно ли расширять server‑API на записи (appointments) или оставить прямой Supabase‑доступ.
- Нужна ли агрегация аналитики в БД (материализованные представления).
- Нужны ли rate‑limits на публичную форму отзывов.
- Требуются ли дополнительные индексы под будущие отчёты.
