# Текущий план миграции mbooking

Короткий ориентир для людей и для **ассистента в новом чате**. Стратегия и чеклисты — в [migration-playbook](../migration-playbook/README.md); развёрнутая дорожная карта — в [FORWARD_PLAN.md](./FORWARD_PLAN.md).

---

## Для ассистента: начни отсюда

1. **Прочитай этот файл целиком** (5 мин.), затем при большом объёме работ — [FORWARD_PLAN.md](./FORWARD_PLAN.md).
2. **Одна строка статуса:** Nest backend в `backend/` поднят; в Prisma описана полная целевая схема; **реализованы `clients`, `categories`, `services`, `appointments`, `discounts`, `feedback`, `client-portal`, `push`, `recommendations`, auth по БД (`User` + opaque `RefreshToken`)**.
3. **Следующее действие (одно):** **поэтапный cutover** `src/api/*` на Nest (или отдельные фичи фронта); опционально `@nestjs/schedule` для `/v1/push/reminders/dispatch`.
4. **Не делать без явной просьбы пользователя:** не удалять Supabase/Next API; не переключать `src/api/*` на Nest, пока домен не готов и не согласован cutover; не менять схему БД «в сторону упрощения» без обсуждения.

### Таблица: домены в Nest (`backend/src/modules/`)

| Домен | В Nest? | Примечание |
|-------|---------|------------|
| health | да | `health/` |
| auth | да | `auth/` — login по `User` (bcrypt), refresh opaque в `RefreshToken` + ротация, см. «Уже сделано» |
| clients | да | `clients/` — CRUD, см. ниже |
| categories | да | `categories/` — CRUD, см. ниже |
| services | да | `services/` — CRUD, см. ниже |
| appointments | да | `appointments/` — CRUD + `POST .../complete`; sync напоминаний через `PushModule` |
| discounts | да | `discounts/` — owner `client_discounts`, см. ниже |
| feedback | да | `feedback/` — см. ниже |
| client-portal | да | `client-portal/` — invite/activate + client routes |
| push | да | `push/` — см. «Уже сделано» |
| recommendations | да | `recommendations/` — см. «Уже сделано» |

### После завершения шага «Сейчас»

Обнови **этот файл**: перенеси домен в таблицу (столбец «В Nest?» = да), опиши маршруты в «Уже сделано», выставь новый пункт в «Сейчас» и при необходимости поправь [FORWARD_PLAN.md](./FORWARD_PLAN.md).

---

## Важно для нового чата (handoff)

**Новый чат не помнит предыдущий диалог.** Он опирается на репозиторий и на `docs/migration-status/*.md`.

**Source of truth по стратегии:** [migration-playbook/README.md](../migration-playbook/README.md) и файлы `01`–`09` в той же папке.

**Репозиторий:**

- Корень: Next.js (Supabase) — **не ломать** до cutover по доменам.
- `backend/`: NestJS + Prisma — **вся новая** серверная логика миграции.

**Локальный запуск backend:**

1. PostgreSQL, БД (например `mbooking_backend`).
2. `backend/.env.example` → `backend/.env`, заполнить `DATABASE_URL`, JWT-секреты (≥ 8 символов), при необходимости **`PUBLIC_APP_URL`** (origin фронта для ссылок вроде `/feedback/...` после complete). Для push: **`VAPID_*`**, опционально **`CRON_SECRET`**. Для рекомендаций: **Yandex AI** (`YANDEX_*`), см. `.env.example`.
3. В `backend/`: `npm install` → `npm run prisma:generate` → `npx prisma migrate deploy`; при необходимости `backend/prisma/manual_indexes.sql` (GiST может падать — см. «Технический долг»). Первый owner: **`npm run db:seed`** (см. `SEED_OWNER_*` в `.env.example`).
4. `npm run start:dev` → `http://localhost:4000`, API: **`/v1`**.
5. Smoke: `GET http://localhost:4000/v1/health` → `database: "up"`.
6. Push (опционально): готовые команды в [PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md](./PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md) — секция **«Чеклист с curl»** (owner + client portal + `appointments/event`).

**Auth сейчас:** `POST /v1/auth/login` (email нормализуется в lower case, пароль — `User.passwordHash`), `POST /v1/auth/refresh` с **`Authorization: Bearer <opaque refresh>`** (не JWT; строка из ответа login), `POST /v1/auth/logout` с телом `{ "refresh_token": "..." }`, `GET /v1/auth/me` с access JWT. Access payload: `sub` = id пользователя в БД. Старые JWT-refresh после обновления бэкенда перестают работать — нужен новый login.

## Принципы

- Не ломать текущий Next.js и Supabase до поэтапного cutover.
- Новый backend — additive.
- Домен за доменом: backend → проверка → (отдельным этапом) переключение transport во фронте.

## Уже сделано

- NestJS в `backend/`: Config, Prisma, Health, глобальный префикс `v1`, ValidationPipe.
- **AuthModule** (`backend/src/modules/auth/`): проверка пароля через **bcrypt**, **opaque refresh** (хранение SHA-256 в `RefreshToken`, срок из `JWT_REFRESH_EXPIRES_IN`), **ротация** refresh при `/auth/refresh`, отзыв через **`POST /v1/auth/logout`**. Access JWT только с `type: access` (guard). Сид: `prisma/seed.ts`, команда **`npm run db:seed`**.
- Сверка SQL/схемы: [10_SUPABASE_SQL_EXTRACTION_WORKSHEET.md](../migration-playbook/10_SUPABASE_SQL_EXTRACTION_WORKSHEET.md).
- `backend/prisma/schema.prisma` + миграции; ручные индексы из `backend/prisma/manual_indexes.sql` (кроме GiST overlap).
- Общее для доменов: `JwtAuthGuard`, `OwnerRoleGuard`, `CurrentUser`, `backend/src/common/utils/normalize-phone.ts` (как `src/validators/normalizePhone.ts`).
- **ClientsModule** (`backend/src/modules/clients/`):
  - `GET/POST /v1/clients`, `PATCH/DELETE /v1/clients/:id` (**id в path**; у Next было `?id=` — при cutover фронта поправить URL).
  - Ответы `{ data }`, поля как у Zod-клиента: `id`, `created_at`, `name`, `phone`, `user_id`.
  - Дубликат `phone` → 409; чужая запись → 403; только роль `owner`.
- **CategoriesModule** (`backend/src/modules/categories/`):
  - `GET/POST /v1/categories`, `PATCH/DELETE /v1/categories/:id` (**id в path**; у Next было `?id=`).
  - Ответы `{ data }`, поля как у Zod-категории: `id`, `created_at`, `category_name`, `user_id`.
  - Дубликат `category_name` → 409; чужая запись → 403; только роль `owner`.
- **ServicesModule** (`backend/src/modules/services/`):
  - `GET/POST /v1/services`, `PATCH/DELETE /v1/services/:id` (**id в path**; у Next было `?id=`).
  - Ответы `{ data }`, поля как у Zod-услуги: `id`, `created_at`, `user_id`, `name`, `category_id`, `price`.
  - Проверка owner-scope по записи услуги и по `category_id` (нельзя привязать услугу к чужой категории); только роль `owner`.
- **AppointmentsModule** (`backend/src/modules/appointments/`):
  - `GET/POST /v1/appointments`, `PATCH/DELETE /v1/appointments/:id` (owner-scope).
  - `POST /v1/appointments/:id/complete` — как `app/api/appointments/[id]/complete/route.ts`: суммы, скидка `client_discounts`, сброс `applied_discount_id` при `ignore_discount`, синхронизация `appointment_reminders` (`AppointmentRemindersSyncService` в `push/`, логика из `src/server/push/reminders.ts`), создание/переиспользование `feedback_tokens`, ответ `{ data: { feedback_token, feedback_url } }`; `feedback_url` строится из **`PUBLIC_APP_URL`** (fallback `http://localhost:3000`).
  - Ответы CRUD `{ data }`, поля в snake_case под `src/schemas/books/bookSchema.ts`.
  - Нормализация `client_phone`, проверка диапазона времени, проверка `service_id` по владельцу; конфликт слота (unique) → 409.
- **PushModule** (`backend/src/modules/push/`) — эталон `app/api/push/*` + `dispatchDueAppointmentReminders` из `src/server/push/reminders.ts` / `sendPush.ts`:
  - owner JWT: `POST /v1/push/subscribe`, `DELETE /v1/push/subscribe`, `GET|PATCH /v1/push/settings`, `POST /v1/push/reminders/sync`, `POST /v1/push/test`, `POST /v1/push/appointments/event`.
  - `GET|POST /v1/push/reminders/dispatch` — если задан **`CRON_SECRET`**, допускается тот же секрет в `Authorization: Bearer` или `x-cron-secret` (режим `all`); иначе owner JWT (режим `self`). Планировщик по-прежнему может быть внешним (как вызов Next cron).
  - VAPID: `VAPID_PUBLIC_KEY` или `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
  - `POST /v1/push/appointments/event` дублирует пуш **клиенту** (см. `ClientPortalLink` + `notifications_enabled`), см. [PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md](./PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md).
  - Готовый smoke под **`curl`**: в том же файле секция **«Чеклист с curl»**.
- **DiscountsModule** (`backend/src/modules/discounts/`) — owner, таблица `ClientDiscount`:
  - `GET /v1/discounts?phone=&service_id=&is_used=true|false` — как `app/api/discounts/route.ts` (невалидный `phone` / `service_id` → `{ data: [] }`; при `is_used=false` отфильтровываются просроченные по `expires_at`).
  - `POST /v1/discounts` — ручная скидка (`source_type: manual`), нормализация телефона, проверка услуги по owner.
  - `PATCH /v1/discounts/:id/use` — как `app/api/discounts/[id]/use` (пометить использованной, сброс резерва).
  - Ответы `{ data }` в формате `src/schemas/discounts/discountSchema.ts` (snake_case).
  - **Не перенесено:** `GET /api/client/discounts` (клиентский кабинет) — отдельный модуль/роли позже; таблица `DiscountRule` в Prisma — отдельно, если появится во фронте.
- **FeedbackModule** (`backend/src/modules/feedback/`) — эталон `app/api/feedback/*`, логика `submit_feedback` из SQL перенесена в сервис (транзакция: ответ → пометка токена → скидка по `appointment_id` + `DiscountRule`):
  - `@Public()` `POST /v1/feedback/submit`, `GET /v1/feedback/validate?token=`
  - owner: `POST /v1/feedback/token` (тело `{ expiresIn?: string }`, формат `N days`, иначе 14 дней), `GET /v1/feedback/responses`, `DELETE /v1/feedback/responses?id=`, `GET /v1/feedback/ratings` (период как во фронте: `period` **или** пара `from`/`to` YYYY-MM-DD).
- **ClientPortalModule** (`backend/src/modules/client-portal/`):
  - owner: `POST /v1/client/invitations` (создание приглашения; owner-only).
  - public: `GET /v1/client/invitations/:token/validate`, `POST /v1/client/invitations/:token/activate`.
  - client role (`client_portal`): `GET /v1/client/me`, `GET /v1/client/appointments`, `GET /v1/client/discounts`, `PATCH /v1/client/settings`, `POST /v1/client/push/subscribe`, `DELETE /v1/client/push/subscribe`, `POST /v1/client/push/test`.
  - activate flow сделан транзакционно: `User` (role `client_portal`) + `ClientPortalProfile` + `ClientPortalLink` + пометка invite `usedAt`.
- **RecommendationsModule** (`backend/src/modules/recommendations/`) — эталон `app/api/recommendations/*`; LLM в Nest только **Yandex AI** (`YANDEX_*`):
  - `GET /v1/recommendations?period=...` **или** `?from=&to=` — список `ai_recommendations` (snake_case как Zod `aiRecommendationSchema`).
  - `DELETE /v1/recommendations?id=` — удаление записи рекомендации.
  - `POST /v1/recommendations/jobs` и `POST /v1/recommendations/generate` — постановка job (дедуп по queued/running + период + `prompt_id`).
  - `GET /v1/recommendations/jobs/:id`, `POST /v1/recommendations/jobs/:id/run` — статус и запуск (claim `queued` → LLM → `ai_recommendations` → `succeeded` / `failed`).
  - `GET/POST/PATCH/DELETE /v1/recommendations/prompts` — CRUD промптов (`PATCH`/`DELETE` с `?id=`), как во фронте.

## Сейчас (следующий шаг)

1. **Поэтапный cutover** `src/api/*` на Nest (и обновление фронта под opaque refresh, если уже ходит в Nest-auth); опционально `@nestjs/schedule` для push dispatch.

**Не обязательно на этом шаге:** менять Next или `src/api` — только Nest, если не попросили cutover.

## Дальше по порядку (playbook)

После categories и services см. [FORWARD_PLAN.md §4](./FORWARD_PLAN.md).

Кратко: ServicesModule → AppointmentsModule → DiscountsModule → FeedbackModule → ClientPortalModule → Push/reminders → Recommendations (+ при необходимости Charts).

## Auth и фронт (позже / параллельно)

- Точечно переключать `src/api/*` домен за доменом после готовности Nest API; на фронте хранить refresh как **opaque строку**, передавать в `Authorization: Bearer` только для `POST /v1/auth/refresh`.

## Технический долг / известные зазоры

- GiST `appointments_user_no_overlap` не на всех Postgres; MVP — проверка пересечений в сервисе.
- Имена моделей Prisma PascalCase vs `snake_case` в Supabase — при data migration нужен mapping.

## Быстрые ссылки

| Что | Где |
|-----|-----|
| Расширенный план | [FORWARD_PLAN.md](./FORWARD_PLAN.md) |
| Push: минималка, roadmap, **curl smoke** | [PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md](./PUSH_NOTIFICATIONS_FUTURE_IMPROVEMENTS.md) |
| Backend env | `backend/.env` (не коммитить) |
| Prisma | `backend/prisma/schema.prisma`, `backend/prisma/migrations/` |
| Ручные индексы | `backend/prisma/manual_indexes.sql` |
| Playbook | `docs/migration-playbook/README.md` |

## Как обновлять этот файл

После каждого завершённого этапа: обнови таблицу «домены в Nest», блок «Уже сделано», «Сейчас», при необходимости — FORWARD_PLAN.
