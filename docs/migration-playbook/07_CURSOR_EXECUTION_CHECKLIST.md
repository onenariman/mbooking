# 07. Cursor Execution Checklist

## Назначение

Этот файл нужен как рабочая инструкция для `Cursor AI`, который потом будет выполнять переход.

Главная установка:

- не ломать текущий рабочий проект;
- переписывать backend аккуратно рядом;
- переключать домены только после проверки.

## 1. Основные правила для Cursor

Cursor не должен:

- удалять Supabase code заранее
- переписывать весь frontend
- менять UUID на числовые id
- перепридумывать бизнес-логику скидок
- смешивать миграцию auth и redesign UI
- делать production cutover без staging verification

Cursor должен:

- работать маленькими фазами
- после каждой фазы фиксировать результат
- держать обратимый путь
- проверять живые flows вручную

## 2. Этапы, в которых должен работать Cursor

### Этап 1. Inventory

Сделать:

- собрать все таблицы из `types/database.types.ts`
- собрать все migrations из `supabase/migrations`
- собрать все route handlers из `app/api`
- собрать все Supabase entry points из:
  - `src/utils/supabase/*`
  - `src/server/*`
  - `src/api/*`

### Этап 2. New backend bootstrap

Сделать:

- создать новый NestJS проект
- подключить Prisma
- подключить ConfigModule
- настроить JWT auth skeleton
- сделать health route

### Этап 3. Prisma schema draft

Сделать:

- описать все базовые модели
- добавить enum
- добавить индексы и unique constraints
- не упрощать схему агрессивно

### Этап 4. DB bring-up

Сделать:

- поднять новую PostgreSQL локально или в staging
- применить Prisma migrations
- проверить структуру таблиц

### Этап 5. Auth migration

Сделать:

- owner login
- refresh token flow
- client portal login
- invite activation
- password reset skeleton

### Этап 6. Domain-by-domain migration

В строгом порядке:

1. `clients`
2. `categories`
3. `services`
4. `appointments`
5. `discounts`
6. `feedback`
7. `client portal`
8. `push/reminders`
9. `recommendations`

После каждого домена:

- backend endpoint готов
- frontend переключен
- smoke test пройден

## 3. Что Cursor должен проверять после каждого домена

Минимум:

- create
- read
- update
- delete, если он есть
- unauthorized
- wrong-owner access
- validation error

Для client-facing flows:

- happy path
- expired token path
- duplicate path

## 4. Особые правила по appointments

`appointments` нельзя переносить "как обычный CRUD".

Cursor должен отдельно проверить:

- create appointment
- edit appointment
- cancel appointment
- complete appointment
- reminder sync
- discount application
- feedback token generation

## 5. Особые правила по discounts

Cursor должен сохранить:

- service-scoped discounts
- feedback-generated discounts
- manual discounts
- reserved/used logic

Нельзя:

- упрощать модель до "просто скидка на клиента"

## 6. Особые правила по client portal

Cursor должен сохранить:

- invite generation
- token hashing
- activation
- email/password login
- owner/client separation
- portal links

Нельзя:

- привязывать клиентский кабинет к owner session
- ломать protected/public route separation

## 7. Особые правила по push/reminders

Cursor должен переносить:

- push subscriptions
- owner reminder settings
- appointment reminders
- event push
- scheduled dispatch

На этапе backend migration reminders можно оставить:

- через internal endpoint + cron

## 8. Особые правила по recommendations

Cursor должен понимать:

- рекомендации уже оформлены как jobs
- их не надо превращать в синхронный хаос
- cleanup должен быть отдельной scheduled задачей

## 9. Что должно получиться перед cutover

До финального перехода Cursor должен дать:

- новый backend
- рабочую Prisma schema
- staging migration plan
- frontend switched to Nest endpoints
- auth без Supabase
- production deployment plan под Timeweb

## 10. Что считать готовностью к final switch

Можно переключать проект только когда:

- все критичные домены уже работают на Nest
- staging smoke test пройден
- data migration rehearsal пройдена
- rollback plan описан
- Timeweb deployment проверен

## 11. Минимальный итоговый пакет артефактов от Cursor

Cursor должен в итоге подготовить:

- `backend/` проект
- `schema.prisma`
- Prisma migrations
- import/export scripts
- env example files
- deployment notes
- cutover checklist
- rollback notes

## 12. Идеальная последовательность работы Cursor

1. Inventory
2. Backend bootstrap
3. Prisma schema
4. Auth
5. Clients/Categories/Services
6. Appointments
7. Discounts
8. Feedback
9. Client portal
10. Push/reminders
11. Recommendations
12. Data migration rehearsal
13. Timeweb deploy rehearsal
14. Final cutover prep
