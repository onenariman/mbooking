# План внедрения регистрации через Яндекс OAuth (Mbooking)

Технический пошаговый план под текущую архитектуру: `Next.js + NestJS + Prisma + cookie sessions`.

Источник по OAuth: `https://yandex.ru/dev/id/doc/ru/`.

---

## 1) Цель и итоговое поведение

- Owner может войти/зарегистрироваться только через Яндекс.
- Парольная owner-регистрация отключена.
- При первом входе через Яндекс создается owner-аккаунт и trial 7 дней.
- При повторном входе пользователь авторизуется в существующий аккаунт.

---

## 2) Изменения в БД (Prisma)

## 2.1 Изменить `User`
- `passwordHash` -> nullable.
- добавить `authType` enum:
  - `password`
  - `oauth_yandex`

## 2.2 Добавить таблицу `OAuthIdentity`

Поля:
- `id` UUID pk
- `userId` UUID fk -> `User.id`
- `provider` enum (`yandex`)
- `providerUserId` string
- `providerEmail` string?
- `rawProfile` json?
- `createdAt`
- `updatedAt`

Индексы:
- unique `(provider, providerUserId)`
- index `(userId)`

## 2.3 Добавить таблицу trial/subscription (если еще нет)

Минимум:
- `OwnerSubscription`:
  - `ownerUserId` unique
  - `status` (`trial|active|expired|canceled`)
  - `trialStartedAt`
  - `trialEndsAt`
  - `currentPeriodStart`
  - `currentPeriodEnd`

---

## 3) ENV и config

В `backend/.env` и `env.schema.ts` добавить:
- `YANDEX_OAUTH_CLIENT_ID`
- `YANDEX_OAUTH_CLIENT_SECRET`
- `YANDEX_OAUTH_REDIRECT_URI`
- `YANDEX_OAUTH_SCOPES` (например `login:email login:info`)
- `OWNER_PASSWORD_REGISTRATION_ENABLED=false`

Важно:
- redirect URI должен 1:1 совпадать с настройками в Яндексе.

---

## 4) Backend: auth flow

Папка: `backend/src/modules/auth`

## 4.1 Новые endpoints

1. `GET /v1/auth/yandex/start`
- генерирует `state` (+ PKCE code verifier при необходимости);
- сохраняет anti-csrf данные (подписанная cookie/short-lived storage);
- редиректит на Яндекс authorize URL.

2. `GET /v1/auth/yandex/callback`
- проверяет `state`;
- забирает `code`;
- меняет `code` на access token;
- получает профиль из Яндекс ID (`id`, `default_email`, имя и т.д.);
- делает login-or-register;
- выпускает ваши owner access/refresh токены и cookie;
- редиректит в приложение (`/receptions` или `/billing` по логике доступа).

## 4.2 Login-or-register алгоритм

1. Найти `OAuthIdentity(provider=yandex, providerUserId=...)`.
2. Если найдено:
- взять `userId`, проверить `User.isActive`, войти.
3. Если не найдено:
- если есть пользователь с таким email и он owner:
  - привязать `OAuthIdentity` к нему (merge).
- иначе:
  - создать `User(role=owner, authType=oauth_yandex, passwordHash=null)`;
  - создать `OAuthIdentity`;
  - создать `OwnerSubscription(status=trial, trialEndsAt=now+7d)`.

## 4.3 Безопасность
- обязательная проверка `state`.
- токен обменивать только на backend.
- логировать ошибки без утечки токенов/секретов.

---

## 5) Ограничение старого password auth

## 5.1 Что отключаем
- Owner `POST /v1/auth/register` (уже флагом можно выключить).
- Owner `POST /v1/auth/login` по паролю:
  - либо полностью выключить;
  - либо временно оставить для legacy users на migration window.

## 5.2 Рекомендуемый переход
- Неделя-две dual mode для существующих аккаунтов.
- Затем парольный login owner отключить полностью.

---

## 6) Frontend: app/api/hooks (TanStack Query)

## 6.1 Что добавить в `app`
- Кнопку `Войти через Яндекс` на `/login`.
- Handler старта oauth:
  - переход на `/api/nest-v1/auth/yandex/start` (или прямой backend endpoint через BFF).
- Callback-страницу можно не делать, если backend сам редиректит.

## 6.2 API слой `src/api`
- `src/api/auth.api.ts`:
  - `startYandexAuth(): void` (redirect flow)
  - `fetchOwnerMe()` (после callback)

## 6.3 Hooks `src/hooks`
- `useOwnerSession` (TanStack Query, key `["owner","me"]`)
- после успешного callback:
  - `queryClient.invalidateQueries({ queryKey: ["owner","me"] })`

---

## 7) Интеграция с trial/paywall

После oauth login backend должен сразу отдавать access state:
- `trial_active`
- `payment_required`
- `paid_active`

Рекомендуется endpoint:
- `GET /v1/billing/subscription`

Frontend поведение:
- `trial_active` -> доступ к базовым страницам, lessons/recommendations закрыты.
- `payment_required` -> редирект на `/paywall`.

---

## 8) Пошаговый порядок внедрения

1. Prisma: `User` change + `OAuthIdentity` + `OwnerSubscription`.
2. Миграция и генерация клиента.
3. ENV schema + app config для Яндекс OAuth.
4. `auth` module: endpoints `yandex/start`, `yandex/callback`.
5. Реализация login-or-register + trial creation.
6. Выключение owner password registration.
7. Frontend кнопка + старт oauth flow.
8. Проверка состояния подписки после входа и редиректы.
9. E2E smoke tests.

---

## 9) Тест-кейсы (обязательно)

1. Новый пользователь через Яндекс:
- создается `User`, `OAuthIdentity`, `OwnerSubscription(trial 7d)`.

2. Повторный вход того же Яндекс-аккаунта:
- новый user не создается.

3. Ошибка/отмена на стороне Яндекса:
- корректный редирект на `/login?error=oauth_cancelled`.

4. Несовпадение `state`:
- вход отклоняется.

5. Просроченный trial без оплаты:
- backend возвращает `payment_required`.

---

## 10) Definition of Done

- В прод-окружении owner может войти только через Яндекс OAuth.
- Первый вход создает trial на 7 дней автоматически.
- Старый парольный сценарий owner отключен (или оставлен только временно для migration).
- Сессии и cookies работают в текущей схеме приложения.
- Доступ к приложению после входа корректно управляется subscription state.