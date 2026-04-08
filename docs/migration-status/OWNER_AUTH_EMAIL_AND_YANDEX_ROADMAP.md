# Вход мастера: Nest (сейчас) и дорожная карта «только Яндекс»

## Сейчас (Postgres + Nest, без Supabase для мастера)

- Регистрация: **`POST /v1/auth/register`** в Nest (роль `owner`, пароль bcrypt). Отключается в Nest: `OWNER_PASSWORD_REGISTRATION_ENABLED=false`.
- Вход: **`POST /v1/auth/login`** → те же токены, что и раньше (access JWT + opaque refresh в БД).
- Next: формы **`/register`** и **`/login`** вызывают Nest с сервера и ставят **httpOnly cookie**; middleware пускает мастера по **access JWT** (секрет `NEST_JWT_ACCESS_SECRET` / `JWT_ACCESS_SECRET` в Next = `JWT_ACCESS_SECRET` в Nest).
- Данные мастера в UI: прокси **`/api/nest-v1/*`** на Nest (cookie, не `localStorage`).

Подробнее по env: [NEST_FRONTEND_MINIMAL.md](./NEST_FRONTEND_MINIMAL.md).

## Зачем в перспективе только Яндекс

Открытая регистрация по email/паролю без дополнительных мер упрощает массовые регистрации, перебор паролей и спам. **Вход через Яндекс ID** сужает поверхность атак и убирает хранение пароля мастера у вас.

## Будущий шаг

1. Включить OAuth Яндекса на стороне Next или Nest (обмен code → сессия).
2. Создавать или связывать запись `User` с ролью `owner` только после успешного OIDC.
3. Отключить `POST /v1/auth/register` и парольный login в проде.

## Примечание

Клиентский кабинет (`/client/*`) по-прежнему может использовать Supabase, пока его не переведёте на Nest; middleware не требует Supabase для доступа мастера по Nest cookie.
