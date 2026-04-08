# 01. Master Plan

## Цель

Перевести текущий `mbooking`:

- с `Supabase Auth`
- с `Supabase DB platform`
- с `Supabase RPC / RLS / pg_cron`
- с `Vercel`

на целевой стек:

- `Next.js` как frontend
- `NestJS` как backend
- `Prisma` как ORM и схема миграций
- `PostgreSQL` как БД
- `Nginx + PM2 + cron` на `Timeweb Cloud Server`

## Что важно не сломать

До финального cutover должны продолжать работать:

- админский логин
- записи
- услуги
- категории
- скидки
- feedback flow
- клиентский кабинет
- push подписки
- reminder logic
- AI recommendations

## Главный принцип

Не переписывать все разом.

Правильная стратегия:

1. Зафиксировать текущее состояние проекта.
2. Поднять новый backend рядом.
3. Повторить текущую схему БД в Prisma.
4. По доменам переписать бизнес-логику на NestJS.
5. Переключить frontend на новый backend.
6. Только после этого отказаться от Supabase.

## Целевая стратегия миграции

### Фаза A. Подготовка

- зафиксировать текущий `main`
- убедиться, что все миграции Supabase в репозитории
- описать текущие зависимости на Supabase
- описать бизнес-инварианты

### Фаза B. Новый backend

- создать `NestJS` backend
- подключить `Prisma`
- подключить новый `PostgreSQL`
- сделать базовый `AuthModule`
- поднять healthcheck

### Фаза C. Prisma schema

- повторить текущую схему `public`-таблиц
- добавить новые системные модели для auth и refresh tokens
- сохранить UUID, unique constraints, indexes, связи

### Фаза D. Data migration

- выгрузить данные из Supabase/Postgres
- загрузить их в новый PostgreSQL
- проверить counts и foreign keys

### Фаза E. Auth migration

- owner auth
- client portal auth
- invite activation
- password reset
- guards и роли

### Фаза F. Domain migration

Переносить строго по доменам:

1. `clients`
2. `categories`
3. `services`
4. `appointments`
5. `discounts`
6. `feedback`
7. `client portal`
8. `push / reminders`
9. `recommendations`

### Фаза G. Frontend cutover

- `src/api/*` переключаются на Nest API
- Supabase middleware больше не нужен
- frontend остается UI-слоем

### Фаза H. Infra cutover

- Timeweb server
- Nginx
- PM2
- SSL
- cron

### Фаза I. Final cutover

- переключение env
- smoke test
- rollback window
- удаление Supabase-зависимостей

## Почему не надо сразу трогать frontend

Текущий frontend уже работает и несет много бизнес-UI.

Значит лучший путь:

- не переписывать UI;
- менять только backend и data layer;
- сохранять компоненты, формы и TanStack Query, где возможно.

## Правильный критерий завершения миграции

Миграция считается завершенной только когда:

- frontend больше не зависит от `@supabase/*`
- auth работает без Supabase
- все домены ходят в Nest API
- reminders работают через server-side scheduler
- проект развертывается без Vercel и без Supabase

## Что не делать

Нельзя:

- переносить auth последним
- удалять Supabase code заранее
- одновременно менять схему данных и бизнес-правила
- переписывать UI и backend в одном шаге
- менять UUID на числовые id
