# 03. Nest Backend Module Map

## Цель

Разложить будущий backend на понятные модули до начала кодинга.

Это важно, чтобы Cursor не начал писать один гигантский `AppService` или хаотичный набор контроллеров.

## 1. Рекомендуемая структура backend

```text
backend/
  src/
    app.module.ts
    main.ts
    common/
      auth/
      decorators/
      dto/
      filters/
      guards/
      interceptors/
      pipes/
      utils/
    config/
    prisma/
    modules/
      auth/
      client-auth/
      users/
      clients/
      categories/
      services/
      appointments/
      discounts/
      feedback/
      client-portal/
      push/
      recommendations/
      charts/
      health/
```

## 2. Общие модули

### `PrismaModule`

- один `PrismaService`
- graceful shutdown
- транзакции
- логирование запросов при необходимости

### `ConfigModule`

- env validation
- typed config

### `Common`

Стоит вынести сюда:

- `CurrentUser` decorator
- `Roles` decorator
- `JwtAuthGuard`
- `RolesGuard`
- `Public` decorator
- global validation pipe
- global exception filter
- phone normalization utility

## 3. Auth split

Лучше разделить auth на два слоя.

### `AuthModule`

Для владельца бизнеса:

- login
- refresh
- logout
- access tokens
- refresh tokens

### `ClientAuthModule`

Для клиентского кабинета:

- invite activation
- login
- logout
- request password reset
- confirm password reset

## 4. Доменные модули

### `UsersModule`

- базовая работа с таблицей `users`
- поиск по email
- поиск по id
- смена роли/статуса

### `ClientsModule`

- CRUD клиентов
- нормализация телефона
- поиск дублей

### `CategoriesModule`

- CRUD категорий

### `ServicesModule`

- CRUD услуг
- связь с категориями

### `AppointmentsModule`

- список записей
- создание
- редактирование
- отмена
- завершение визита
- пересчет reminders
- вызов event-notifications

Это один из самых критичных модулей.

Внутри полезно выделить:

- `AppointmentsService`
- `AppointmentCompletionService`
- `AppointmentReminderPlanningService`

### `DiscountsModule`

- manual discounts
- service-scoped discounts
- reserve/use rules
- feedback-generated discounts

### `FeedbackModule`

- public token validation
- submit feedback
- issue feedback-based discount
- create feedback token on appointment completion
- feedback responses list
- ratings aggregate

### `ClientPortalModule`

- invites
- profiles
- links
- me
- appointments view
- discounts view
- settings

### `PushModule`

- subscribe/unsubscribe
- test push
- appointment event push
- reminders dispatch
- owner notification settings

### `RecommendationsModule`

- prompts
- jobs
- run job
- save result
- cleanup old jobs

### `ChartsModule`

- overview analytics
- aggregates for dashboard

## 5. Guards и роли

Нужны роли:

- `owner`
- `client_portal`
- `internal_job`

Рекомендуемый подход:

- глобальный JWT guard
- `@Public()` для invite/public feedback routes
- `@Roles("owner")`
- `@Roles("client_portal")`

Для внутренних cron/dispatch endpoints:

- отдельный internal secret
- не public endpoint без защиты

## 6. Внутренние сервисы, которые должны быть отдельными

### `AppointmentCompletionService`

Почему отдельно:

- completion содержит слишком много бизнес-логики:
  - финальная сумма
  - discount consumption
  - feedback token issue
  - status update

### `FeedbackPublicService`

Почему отдельно:

- это public flow
- там токены, сроки действия, скидки

### `ReminderDispatchService`

Почему отдельно:

- это scheduled logic
- должен быть независимо вызываемым

### `ClientPortalInvitesService`

Почему отдельно:

- invite activation и account creation чувствительны
- должны работать транзакционно

## 7. Что в Nest лучше не делать сразу

Не обязательно в первой версии:

- CQRS
- microservices
- event bus
- Redis
- очередь для всего подряд

Сначала важнее:

- чистый модульный backend
- повторение текущей логики
- предсказуемый cutover

## 8. Рекомендуемый API prefix

Лучше сразу ввести:

- `/v1`

Примеры:

- `GET /v1/clients`
- `POST /v1/auth/login`
- `POST /v1/client-auth/login`
- `POST /v1/public/feedback/submit`
- `POST /v1/internal/push/reminders/dispatch`

## 9. Вывод

Nest backend для этого проекта должен быть:

- не монолитным хаосом;
- не enterprise-перегруженным;
- а аккуратным модульным backend, повторяющим текущие бизнес-домены.
