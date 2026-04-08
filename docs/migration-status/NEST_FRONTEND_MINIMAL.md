# Минимальная связка фронта с Nest (мастер)

## Как устроено сейчас

- **Вход и регистрация** (`/login`, `/register`): Server Actions дергают Nest `POST /v1/auth/login` и `POST /v1/auth/register`, затем кладут **access/refresh в httpOnly cookie** (`mbooking_owner_access`, `mbooking_owner_refresh`).
- **Middleware** пускает мастера в приложение, если cookie с access JWT валиден (проверка через **jose**, секрет как у Nest).
- **Запросы к API Nest из браузера** идут на **same-origin** прокси `GET|POST|PATCH|DELETE /api/nest-v1/...` → сервер Next подставляет `Authorization: Bearer <access из cookie>` и вызывает Nest. Так не нужен CORS и не светим JWT в `localStorage`.
- **Supabase в middleware** опционален: если нет `NEXT_PUBLIC_SUPABASE_URL` и ключа, блок просто пропускается; мастер определяется по Nest cookie.

## Переменные Next (`.env.local`)

| Переменная | Назначение |
|------------|------------|
| `NEST_API_INTERNAL_URL` | Предпочтительно для Server Actions и прокси (например `http://localhost:4000` или `http://backend:4000` в Docker). |
| `NEXT_PUBLIC_NEST_API_URL` | Fallback, если internal не задан; нужен для страницы `/dev/nest-auth` (прямой fetch из браузера). |
| `NEST_JWT_ACCESS_SECRET` | Тот же секрет, что `JWT_ACCESS_SECRET` в Nest — для проверки access JWT в middleware. Можно вместо него задать `JWT_ACCESS_SECRET` в Next. |
| `NEXT_PUBLIC_NEST_OWNER_DATA=1` | Включить в `src/api/clients.api.ts` и т.д. ход в Nest **через прокси** даже без `NEXT_PUBLIC_NEST_API_URL` (если задан internal URL на сервере). |
| `NEXT_PUBLIC_OWNER_REGISTRATION_ENABLED=false` | Скрыть ссылку на `/register` и блокировать UI регистрации. |

## Переменные Nest (`backend/.env`)

- `OWNER_PASSWORD_REGISTRATION_ENABLED=false` — отключить `POST /v1/auth/register`.
- `CORS_ORIGINS` — по-прежнему для прямых вызовов с браузера (например `/dev/nest-auth`).

## Почему не «кривой ответ» при регистрации

Запрос **нельзя** отправлять как `fetch('/register')` или POST на URL страницы — Next отдаст **RSC/Flight**, а не JSON. Нужна **форма** с `action={serverAction}` или явный `fetch` на **`http://...:4000/v1/auth/register`** с `Content-Type: application/json`.

## Проверка

1. Nest + migrate + при необходимости `npm run db:seed` или регистрация через `/register`.
2. В `.env.local`: `NEST_API_INTERNAL_URL`, `NEST_JWT_ACCESS_SECRET`, `NEXT_PUBLIC_NEST_OWNER_DATA=1` (и при необходимости `NEXT_PUBLIC_NEST_API_URL` для dev-страницы).
3. `/login` → домашняя страница; раздел клиентов при включённом флаге ходит в Nest через `/api/nest-v1/clients`.

## Дальше

Авто-refresh при 401 в прокси, перенос остальных `src/api/*` на `/api/nest-v1/...`, клиентский кабинет без Supabase — отдельными шагами.
