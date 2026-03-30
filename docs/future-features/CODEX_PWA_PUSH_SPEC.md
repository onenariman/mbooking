# CODEX SPEC - PWA Push + Feedback + Discount + Client Cabinet System

> Этот документ - единый источник правды для реализации клиентского кабинета,
> отзывов, скидок и push-уведомлений.
> Идем сверху вниз и внедряем по приоритетам.

---

## 0. КОНТЕКСТ ПРОЕКТА

### Текущий стек
- Frontend: Next.js + TypeScript + TanStack Query
- Backend/DB: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Валидация: Zod schemas
- API pattern: `app/api/*` route handlers + существующие client-side Supabase вызовы

### Важные реалии текущего кода
- Публичная страница отзыва уже существует в формате `/feedback/[token]`
- Admin auth уже существует и остается как есть: email + password
- Мутации записей сейчас местами идут напрямую из браузера в Supabase
- Завершение визита (`status = completed`) нельзя оставлять на прямом client-side update, потому что там нужна серверная логика
- Отдельный репозиторий или отдельный frontend для клиента на первом этапе НЕ нужен
- Клиентская часть живет в этом же Next.js приложении, но в отдельной зоне маршрутов `/client/*`

### Существующие таблицы (ничего не удалять и не переименовывать)
```text
appointments        - записи клиентов
clients             - клиенты
categories          - категории услуг
services            - услуги
feedback_tokens     - токены для отзывов
feedback_responses  - отзывы
ai_recommendations  - AI рекомендации
recommendation_jobs - джобы генерации рекомендаций
recommendation_prompts - промты для AI
```

### Существующие Supabase Functions (сигнатуры не менять)
```sql
create_feedback_token(p_expires_in text) -> text
submit_feedback(p_token, p_feedback_text, p_score_*) -> text
```

### Существующие hooks/API, которые нельзя ломать
```text
useAppointments / useAddAppointment / useUpdateAppointment / useDeleteAppointment
useClients / useAddClient / useUpdateClient / useDeleteClient
useCategories / useAddCategory / useUpdateCategory / useDeleteCategory
useServices / useAddService / useUpdateServices / useDeleteService
useCreateFeedbackToken / useSubmitFeedback
useFeedbackResponses / useFeedbackRatingsTrend
useRecommendations / useGenerateRecommendations
useRecommendationPrompts / ...
```

---

## 1. ФИКСИРУЕМ ПРОДУКТОВЫЕ РЕШЕНИЯ

### 1.1 Что делаем точно
- Клиентский кабинет будет
- Авторизация клиента будет по приглашению
- Номер телефона клиента фиксируется заранее со стороны бизнеса
- При первом входе клиент не подтверждает номер по SMS, а переходит по invite link и задает себе пароль
- После активации клиент заходит по схеме: номер телефона + пароль
- Клиент сможет зайти в свой кабинет, видеть свои записи, скидки и включать уведомления
- Push-уведомления будут и для admin, и для клиента, но это два разных контура

### 1.2 Что НЕ делаем на первом этапе
- Не заводим отдельный репозиторий для клиентского сайта
- Не делаем отдельную мобильную нативную аппку
- Не пытаемся отправлять push клиенту до того, как у него появится авторизованный кабинет и подписка браузера
- Не переносим весь текущий admin flow на новые маршруты без необходимости

### 1.3 Как будет устроено приложение
- Один Next.js проект
- Две зоны интерфейса:
  - admin zone: существующее приложение для владельца/мастера
  - client zone: новый кабинет клиента под `/client/*`
- Публичная зона отдельно:
  - `/feedback/[token]` - публичный анонимный отзыв

### 1.4 Как будет работать клиентская версия
- Admin отправляет клиенту invitation link
- Invite уже привязан к конкретному номеру телефона клиента
- При первом входе клиент открывает invite link, видит свой номер в read-only виде и задает пароль 2 раза
- После активации кабинет подтягивает данные клиента по нормализованному телефону
- В кабинете клиент видит:
  - будущие записи
  - активные скидки
  - историю завершенных визитов
  - статус уведомлений
- После входа клиент может включить web push в браузере
- После включения push клиент получает:
  - напоминания о визите
  - перенос/отмену записи
  - уведомление о начисленной скидке
  - позже: акции и спецпредложения

### 1.5 Главное архитектурное правило
- Отзыв остается анонимным и публичным через `/feedback/[token]`
- Клиентский кабинет - отдельная сущность
- Это два параллельных сценария:
  - быстрый отзыв по ссылке
  - авторизованный личный кабинет клиента

---

## 2. ПРИОРИТЕТЫ ВНЕДРЕНИЯ

### P0 - Критический фундамент
Сначала делаем то, без чего нельзя безопасно строить все остальное:
1. Миграции БД
2. Нормализация телефонов в единый формат `7XXXXXXXXXX`
3. Серверный route завершения визита
4. Валидация feedback token
5. Начисление скидки после отзыва
6. API и UI скидок в admin части

### P1 - Польза для бизнеса сразу
После P0:
1. PWA для admin
2. Push для admin
3. Cron-напоминания
4. Настройки уведомлений и скидок в admin

### P2 - Клиентская идентификация и кабинет
После P1:
1. Invite-based активация клиента
2. Клиентский кабинет `/client/*`
3. Привязка кабинета к телефону клиента
4. Просмотр записей и скидок внутри кабинета

### P3 - Push для клиента
Только после P2:
1. Подписка клиента на push
2. Напоминания о записи
3. Уведомления о переносе/отмене
4. Уведомления о начисленной скидке

### P4 - Маркетинг и удержание
После P3:
1. Акции и спецпредложения
2. Массовые клиентские кампании
3. История уведомлений в кабинете
4. Более умная loyalty-механика

### Жесткое правило очередности
- Нельзя начинать client push до client auth
- Нельзя встраивать server-only логику в старый client-side `updateAppointment`
- Нельзя делать отдельный client repo до тех пор, пока этот контур не упирается в реальные ограничения

---

## 3. ИТОГОВАЯ ЦЕЛЕВАЯ СХЕМА ПРОДУКТА

### 3.1 Admin flow
```text
admin логин
  -> управляет записями
  -> завершает визит через server route
  -> получает feedback link / token
  -> видит начисленные скидки
  -> получает push о новых событиях
```

### 3.2 Client feedback flow
```text
visit completed
  -> создается feedback_token с appointment_id
  -> клиент получает ссылку на /feedback/[token]
  -> оставляет анонимный отзыв
  -> система начисляет скидку
```

### 3.3 Client cabinet flow
```text
admin отправляет /client/invite/[token]
  -> клиент открывает ссылку
  -> видит свой номер телефона
  -> задает пароль
  -> получает доступ в кабинет
  -> видит записи и скидки
  -> включает push
  -> получает уведомления и акции
```

---

## 4. ИЗМЕНЕНИЯ В БД

## 4.1 Feedback token linkage
```sql
ALTER TABLE public.feedback_tokens
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
```

## 4.2 Push subscriptions

Одна таблица для двух аудиторий: `owner` и `client`.

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience      text NOT NULL CHECK (audience IN ('owner', 'client')),
  endpoint      text NOT NULL,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id, owner_user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push self manage" ON public.push_subscriptions;
CREATE POLICY "push self manage" ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
```

### Как трактовать поля
- `auth_user_id` - реальный auth user, который получит push
- `owner_user_id` - владелец бизнеса, к чьим данным относится уведомление
- `audience = 'owner'`:
  - `auth_user_id = owner_user_id`
- `audience = 'client'`:
  - `auth_user_id = client auth user`
  - `owner_user_id = владелец бизнеса`

## 4.3 Client discounts
```sql
CREATE TABLE IF NOT EXISTS public.client_discounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_phone     text NOT NULL,
  appointment_id   uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  feedback_token   text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 5,
  is_used          boolean NOT NULL DEFAULT false,
  used_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_discounts owner access" ON public.client_discounts;
CREATE POLICY "client_discounts owner access" ON public.client_discounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_discounts_feedback_token_unique
  ON public.client_discounts (feedback_token);

CREATE INDEX IF NOT EXISTS idx_client_discounts_user_phone_active
  ON public.client_discounts (user_id, client_phone, is_used, created_at DESC);
```

## 4.4 Discount rules
```sql
CREATE TABLE IF NOT EXISTS public.discount_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL DEFAULT 5,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_rules owner access" ON public.discount_rules;
CREATE POLICY "discount_rules owner access" ON public.discount_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_rules_one_active_per_user
  ON public.discount_rules (user_id)
  WHERE is_active = true;
```

## 4.5 Client portal profiles

Это app-level профиль для клиента после активации invite и первого входа.

```sql
CREATE TABLE IF NOT EXISTS public.client_portal_profiles (
  auth_user_id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                  text NOT NULL UNIQUE,
  display_name           text,
  notifications_enabled  boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  last_login_at          timestamptz
);

ALTER TABLE public.client_portal_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client profile self access" ON public.client_portal_profiles;
CREATE POLICY "client profile self access" ON public.client_portal_profiles
  FOR ALL
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
```

## 4.6 Client portal links

Связь клиентского auth аккаунта с локальными данными бизнеса.

```sql
CREATE TABLE IF NOT EXISTS public.client_portal_links (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id           uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_phone        text NOT NULL,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz
);

ALTER TABLE public.client_portal_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client portal link access" ON public.client_portal_links;
CREATE POLICY "client portal link access" ON public.client_portal_links
  FOR ALL
  USING (auth.uid() = client_auth_user_id OR auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = client_auth_user_id OR auth.uid() = owner_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_portal_links_owner_client_auth
  ON public.client_portal_links (owner_user_id, client_auth_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_portal_links_owner_phone
  ON public.client_portal_links (owner_user_id, client_phone);
```

### Зачем нужна эта таблица
- Один и тот же номер телефона должен соответствовать одному клиентскому кабинету внутри одного бизнеса
- Admin и client могут безопасно смотреть на одну и ту же сущность
- В будущем сюда можно привязать историю уведомлений, loyalty и campaign targeting

## 4.7 Client portal invites

Invite - это одноразовая ссылка на активацию кабинета или сброс пароля.

```sql
CREATE TABLE IF NOT EXISTS public.client_portal_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_phone   text NOT NULL,
  token_hash     text NOT NULL UNIQUE,
  purpose        text NOT NULL CHECK (purpose IN ('activation', 'password_reset')),
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.client_portal_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client invite owner access" ON public.client_portal_invites;
CREATE POLICY "client invite owner access" ON public.client_portal_invites
  FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_invites_owner_phone_active
  ON public.client_portal_invites (owner_user_id, client_phone, expires_at)
  WHERE used_at IS NULL;
```

### Правила invite
- invite одноразовый
- invite живет ограниченное время, например 72 часа
- в БД хранится только `token_hash`, а не сырой token
- один invite используется либо для активации, либо для сброса пароля

## 4.8 Телефон нормализуем на уровне приложения

На первом этапе НЕ добавляем новые phone columns в старые таблицы.

Жесткое правило:
- любой телефон перед записью в `clients`
- любой телефон перед записью в `appointments`
- любой телефон перед поиском скидок
- любой телефон перед привязкой клиентского кабинета

должен приводиться к формату:

```text
7XXXXXXXXXX
```

Без `+`, пробелов, скобок и дефисов.

---

## 5. СТРУКТУРА ПРИЛОЖЕНИЯ

### 5.1 Один проект, отдельные route zones
```text
app/
  (admin)/
    receptions/
    clients/
    services/
    charts/
    recommendations/
  (public)/
    feedback/[token]/
  (client)/
    client/login/
    client/invite/[token]/
    client/
    client/appointments/
    client/discounts/
    client/settings/
```

### 5.2 Почему не отдельный repo
- текущий scope это не требует
- shared design system уже есть
- shared Supabase слой уже есть
- проще развивать общие types, schemas, utils и API

### 5.3 Когда отдельный client repo вообще может понадобиться
- отдельный публичный бренд и домен
- тяжелый маркетинговый сайт
- отдельная команда и независимый release cycle
- отдельный mobile-first продукт

До этого момента отдельный repo - лишняя сложность.

---

## 6. P0 - БЕЗОПАСНЫЙ CORE: FEEDBACK + DISCOUNTS

## 6.1 Критически важное правило по завершению визита

Текущее прямое обновление `appointments` из клиента оставляем для обычных изменений,
НО завершение визита выводим в отдельный серверный flow.

Нельзя:
- использовать старый `useUpdateAppointment({ status: 'completed' })`

Нужно:
- создать `POST /api/appointments/[id]/complete`
- создать `useCompleteAppointment`

## 6.2 Новый server route завершения визита
```text
POST /api/appointments/[id]/complete
```

### Что делает route
1. Проверяет текущего admin пользователя
2. Обновляет запись на `status = completed`
3. Сохраняет итоговую сумму, если передана
4. Генерирует `feedback_token`
5. Привязывает `appointment_id` к token
6. Возвращает в ответе `feedback_token` и `feedback_url`
7. На этапах P3+ при наличии клиентской подписки отправляет клиенту push

### Важно
- Использовать текущий SSR-подход проекта
- НЕ использовать `@supabase/auth-helpers-nextjs`
- Использовать текущий `createClient()` из server utils

### Ответ route
```json
{
  "data": {
    "feedback_token": "abc123",
    "feedback_url": "https://app.example.com/feedback/abc123"
  }
}
```

### Зачем возвращать ссылку сразу
- admin может сразу отправить ее через SMS/WhatsApp
- route не зависит от client push
- flow полезен уже на P0

## 6.3 Новый hook
Создать:
```text
src/hooks/useCompleteAppointment.ts
```

Или экспортировать из существующего `appointments.hooks.ts`, но без изменения старых сигнатур.

### useCompleteAppointment
- `mutationFn(id, amount?)`
- вызывает `POST /api/appointments/[id]/complete`
- invalidates appointments queries
- возвращает `feedback_url`

## 6.4 Публичный feedback page

Оставляем текущий путь:
```text
/feedback/[token]
```

НЕ переводим его на:
```text
/feedback?token=...
```

Причина:
- путь уже есть в проекте
- path param лучше читается
- меньше ломаем текущую реализацию

## 6.5 Validate token route
```text
GET /api/feedback/validate?token=XYZ
```

### Поведение
- endpoint публичный
- проверяет:
  - token существует
  - `is_active = true`
  - `used_at IS NULL`
  - `expires_at > now()`

### Ответ
```json
{
  "data": {
    "valid": true,
    "appointment_id": "..."
  }
}
```

## 6.6 Submit feedback route
```text
POST /api/feedback/submit
```

### Важное правило
Этот route вызывается анонимно из публичной страницы отзыва.

Поэтому:
- не полагаться на обычную user session
- использовать `supabaseAdmin`

### Поведение
1. Валидировать payload через Zod
2. Вызвать `submit_feedback`
3. Найти token row
4. Найти appointment
5. Найти активное discount rule или взять default 5%
6. Создать запись в `client_discounts`
7. Вернуть `discount_percent`
8. На этапах P3+ при наличии client push отправить уведомление клиенту

### Ответ
```json
{
  "data": {
    "feedback_id": "uuid",
    "discount_percent": 5
  }
}
```

## 6.7 Discounts API для admin

```text
GET   /api/discounts?phone={phone}
GET   /api/discounts
PATCH /api/discounts/[id]/use
```

### Правила
- все admin-only
- телефон всегда нормализуется перед поиском
- `PATCH /use` ставит:
  - `is_used = true`
  - `used_at = now()`

## 6.8 UI изменения в admin

### В форме записи
- при вводе телефона показать активные скидки клиента
- показать бейдж типа `-5%`
- предложить применить скидку к новой записи

### В списке записей
- кнопка "Завершить визит" должна использовать новый `useCompleteAppointment`
- после успешного complete можно:
  - сразу скопировать feedback link
  - открыть WhatsApp/SMS с готовым текстом

---

## 7. P1 - PWA И PUSH ДЛЯ ADMIN

## 7.1 Что входит в P1
- `public/sw.js`
- `public/manifest.json`
- иконки PWA
- `web-push`
- подписка admin устройства
- тестовая отправка
- cron

## 7.2 Service worker
Создать:
```text
public/sw.js
```

Минимум:
- обработка `push`
- показ notification
- `notificationclick`

## 7.3 Manifest
Создать:
```text
public/manifest.json
```

Подключить через `app/layout.tsx` metadata или `head`.

## 7.4 Hook подписки
Создать:
```text
src/hooks/usePushSubscription.ts
```

### API hook
```ts
usePushSubscription({
  audience: 'owner' | 'client',
  ownerUserId: string,
})
```

Возвращает:
- `isSupported`
- `permission`
- `isSubscribed`
- `subscribe()`
- `unsubscribe()`

## 7.5 Subscribe route
```text
POST /api/push/subscribe
```

### Body
```json
{
  "owner_user_id": "uuid",
  "audience": "owner",
  "endpoint": "...",
  "p256dh": "...",
  "auth": "..."
}
```

### Поведение
- берет `auth.uid()` как `auth_user_id`
- upsert в `push_subscriptions`

## 7.6 Универсальная server utility отправки
Создать:
```text
src/lib/sendPush.ts
```

### Пример сигнатуры
```ts
sendPush({
  ownerUserId: string,
  audience: 'owner' | 'client',
  authUserId?: string,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
})
```

### Правила
- читать подписки только через service role
- использовать `Promise.allSettled`
- удалять только dead subscriptions `404/410`

## 7.7 Owner push events

На P1 для admin нужны:
- `feedback_received`
- `discount_issued`
- `appointment_reminder_admin`
- `test_push`

### Не обязательно на P1
- пушить владельцу каждое создание записи, если он и так создает ее сам

## 7.8 Cron
```text
GET /api/cron/reminders
```

### Что делает
- ищет записи за окно примерно `now + 24h`
- на P1 шлет reminder owner'у
- на P3 начинает слать reminder также клиенту, если есть client subscription

---

## 8. P2 - КЛИЕНТСКАЯ АВТОРИЗАЦИЯ И ЛИЧНЫЙ КАБИНЕТ

## 8.1 Решение по auth

Клиентская авторизация в v1:
- activation by invite link
- номер телефона берется из invite и не редактируется клиентом при первой активации
- клиент задает пароль
- дальше логинится по `phone + password`

Это облегченный вариант без SMS и без соцлогинов.

## 8.2 Что нужно настроить
- маршрут генерации invite link для admin
- маршрут активации invite
- экран логина `phone + password`
- reset-flow через новый invite, а не через показ старого пароля

## 8.3 Client activation flow
```text
/client/invite/[token]
  -> validate invite
  -> показать phone в readonly виде
  -> ввести password
  -> повторить password
  -> активировать кабинет
  -> bootstrap client profile
  -> /client
```

## 8.4 Regular login flow

```text
/client/login
  -> ввод телефона
  -> ввод пароля
  -> вход
  -> /client
```

## 8.5 Bootstrap client profile
Создать route:
```text
POST /api/client/profile/bootstrap
```

### Что делает
1. Проверяет client session
2. Берет номер телефона из invite / client account
3. Нормализует номер
4. Upsert в `client_portal_profiles`
5. Ищет соответствующие `clients` и `appointments`
6. Создает или обновляет `client_portal_links`

### Бизнес-правило
На первом этапе кабинет строится вокруг телефона клиента.

То есть клиент не создает "нового клиента" вручную.
Он активирует доступ по invite, а система подтягивает данные, уже существующие у бизнеса.

## 8.6 Client routes

### Публичные
```text
/client/login
/client/invite/[token]
```

### Защищенные
```text
/client
/client/appointments
/client/discounts
/client/settings
```

## 8.7 Что показывает клиентский кабинет на P2

### `/client`
- ближайшая запись
- количество активных скидок
- переключатель уведомлений

### `/client/appointments`
- будущие записи
- последние завершенные визиты

### `/client/discounts`
- активные скидки
- использованные скидки

### `/client/settings`
- телефон
- уведомления
- выход

## 8.8 Client API

```text
POST /api/client/invitations
GET  /api/client/invitations/[token]/validate
POST /api/client/invitations/[token]/activate
GET /api/client/me
GET /api/client/appointments
GET /api/client/discounts
PATCH /api/client/settings
```

### Назначение новых routes
- `POST /api/client/invitations`
  - admin создает invite
  - возвращает activation link
- `GET /api/client/invitations/[token]/validate`
  - публичная проверка invite
- `POST /api/client/invitations/[token]/activate`
  - клиент задает пароль
  - invite помечается использованным
  - создается или активируется клиентский account

### Правило выборки
Все данные client cabinet берутся:
- по `client_auth_user_id`
- через `client_portal_links`
- и далее по `owner_user_id + client_phone`

## 8.9 Password rules

- пароль вводится 2 раза только при активации или смене
- пароль хранится только в виде hash на стороне auth backend
- пароль никогда не хранится и не показывается в открытом виде
- внутри кабинета нельзя показывать клиенту его текущий пароль

### Если клиент забыл пароль
- показывать не пароль, а кнопку "Сменить пароль"
- если клиент залогинен:
  - смена пароля через ввод старого и нового
- если клиент не залогинен:
  - admin создает новый invite с `purpose = password_reset`
  - клиент переходит по reset link и задает новый пароль

## 8.10 Middleware / access rules

Публичными должны стать:
- `/feedback/[token]`
- `/client/login`
- `/client/invite/[token]`

Защищенными клиентской сессией:
- `/client/*`

Защищенными admin сессией:
- весь существующий admin интерфейс

### Важно
Нельзя смешивать client session и admin session логикой "если есть любой user, то пускаем везде".
Нужны явные правила маршрутов.

---

## 9. P3 - PUSH ДЛЯ КЛИЕНТА

## 9.1 Главное ограничение

Клиентский push возможен только если:
1. клиент авторизован
2. клиент включил push в браузере
3. в `push_subscriptions` есть row с `audience = 'client'`

Без этого никакого настоящего client push быть не может.

## 9.2 Client subscribe flow
В клиентском кабинете:
- открыть `/client/settings`
- нажать "Включить уведомления"
- вызвать `usePushSubscription({ audience: 'client', ownerUserId })`
- сохранить подписку
- обновить `client_portal_profiles.notifications_enabled = true`

## 9.3 Client push events

Минимум:
- `appointment_confirmed`
- `appointment_reminder_24h`
- `appointment_rescheduled`
- `appointment_cancelled`
- `discount_issued`

Позже:
- `promotion`
- `special_offer`

## 9.4 Как client push связывается с бизнесом

Push отправляется не просто "по auth user клиента", а в контексте владельца бизнеса:
- `owner_user_id`
- `audience = 'client'`
- `auth_user_id = client auth user`

Так один клиент в будущем может быть связан с несколькими бизнесами без конфликтов.

---

## 10. P4 - АКЦИИ И УДЕРЖАНИЕ

## 10.1 Что входит в P4
- ручные кампании
- сегментация клиентов
- push со спецпредложениями
- история уведомлений в кабинете

## 10.2 Для P4 лучше добавить позже
На этом этапе можно ввести отдельные сущности:
- `marketing_campaigns`
- `campaign_recipients`
- `client_notification_events`

Но в P0-P3 они НЕ нужны.

---

## 11. ТЕХНИЧЕСКИЕ ПРАВИЛА ДЛЯ РЕАЛИЗАЦИИ

## 11.1 Не ломать существующее
- не менять сигнатуры текущих hooks
- не менять сигнатуры `submit_feedback` и `create_feedback_token`
- не удалять существующие таблицы и поля
- не переносить весь текущий flow appointments на новые API без явной необходимости

## 11.2 Обязательные новые сущности
- `feedback_tokens.appointment_id`
- `push_subscriptions`
- `client_discounts`
- `discount_rules`
- `client_portal_profiles`
- `client_portal_links`
- `client_portal_invites`

## 11.3 Типизация
- все новые таблицы добавить в `types/database.types.ts`
- новые Zod schemas создавать по существующему паттерну
- новые hooks делать в стиле текущих hooks: `useQuery`, `useMutation`, `invalidateQueries`

## 11.4 Путь для feedback
Правильный путь:
```text
/feedback/[token]
```

Неправильный путь для этого проекта:
```text
/feedback?token=...
```

## 11.5 Supabase server access

Для route handlers:
- использовать текущий server client проекта
- отдельный `supabaseAdmin` использовать только там, где нужна service role логика

### `supabaseAdmin` нужен в:
- `GET /api/feedback/validate`
- `POST /api/feedback/submit`
- server utilities для push
- cron route

## 11.6 Security rules
- `SUPABASE_SERVICE_ROLE_KEY` только на сервере
- client не должен видеть чужие данные даже если у него тот же номер в другом бизнесе
- все телефоны перед сравнением нормализуются
- все новые таблицы под RLS

---

## 12. ENV И ИНФРАСТРУКТУРА

### 12.1 App env
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
CRON_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 12.2 Supabase requirements
- auth backend с поддержкой client account и password hashing
- server routes для invite activation и password reset
- корректные RLS policies

### 12.3 Vercel / cron
- `vercel.json` с cron route
- `CRON_SECRET` в env

---

## 13. ПОРЯДОК РЕАЛИЗАЦИИ ПО ШАГАМ

### Этап A - сначала делаем обязательно
1. Миграции БД
2. Обновление `database.types.ts`
3. Нормализация телефонов во всех write/read сценариях
4. `supabaseAdmin`
5. `POST /api/appointments/[id]/complete`
6. `useCompleteAppointment`
7. `GET /api/feedback/validate`
8. Обновление `/feedback/[token]`
9. `POST /api/feedback/submit` с начислением скидки
10. `/api/discounts*`
11. UI скидок в admin

### Этап B - потом admin push
12. `web-push` dependency
13. `public/sw.js`
14. `public/manifest.json`
15. `usePushSubscription`
16. `POST /api/push/subscribe`
17. `sendPush`
18. `GET /api/cron/reminders`
19. Admin settings UI

### Этап C - потом client auth и кабинет
20. `/client/login`
21. `POST /api/client/invitations`
22. `GET /api/client/invitations/[token]/validate`
23. `POST /api/client/invitations/[token]/activate`
24. `POST /api/client/profile/bootstrap`
25. `/api/client/me`
26. `/api/client/appointments`
27. `/api/client/discounts`
28. `/client/invite/[token]`
29. `/client`
30. `/client/appointments`
31. `/client/discounts`
32. `/client/settings`

### Этап D - потом client push
33. client push subscriptions
34. notification toggle
35. client reminder pushes
36. discount issued push
37. reschedule/cancel pushes

### Этап E - потом marketing
38. promotions
39. campaign delivery
40. notification inbox

---

## 14. ФИНАЛЬНАЯ СХЕМА ДАННЫХ

```text
appointments --------------------------+
  - id                                 |
  - client_phone                       |
  - status                             |
  - appointment_at                     |
  - user_id                            |
                                        |
feedback_tokens                         |
  - token                               |
  - appointment_id ---------------------+
  - user_id
  - is_active
  - expires_at
  - used_at
        |
        v
feedback_responses
  - feedback_text
  - score_*
  - user_id

client_discounts
  - user_id
  - client_phone
  - appointment_id
  - feedback_token
  - discount_percent
  - is_used

discount_rules
  - user_id
  - discount_percent
  - is_active

client_portal_profiles
  - auth_user_id
  - phone
  - notifications_enabled

client_portal_links
  - owner_user_id
  - client_auth_user_id
  - client_phone
  - client_id

client_portal_invites
  - owner_user_id
  - client_phone
  - token_hash
  - purpose
  - expires_at
  - used_at

push_subscriptions
  - auth_user_id
  - owner_user_id
  - audience (owner/client)
  - endpoint
  - p256dh
  - auth
```

---

## 15. ИТОГОВЫЕ ВЫВОДЫ

### Что считаем правильной стратегией
- отдельный client repo сейчас не нужен
- client cabinet нужен
- auth клиента делаем через invite link + phone + password
- feedback flow и client cabinet - разные, но связанные сценарии
- client push делаем только после client auth

### Самый важный порядок
```text
P0 core business logic
  -> P1 admin PWA/push
  -> P2 client auth/cabinet
  -> P3 client push
  -> P4 promotions
```

### Самая частая ошибка, которую нельзя допустить
- пытаться построить клиентские уведомления до того, как у клиента появился авторизованный кабинет и browser subscription
