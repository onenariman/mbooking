# 05. Data Migration And Cutover

## Цель

Перенести данные из текущего Supabase/Postgres в новый PostgreSQL так, чтобы:

- не потерять UUID;
- не потерять связи;
- не потерять историю;
- не поломать client portal и скидки;
- иметь rollback.

## 1. Общий принцип

Сначала делаем `staging migration`, не production cutover.

Правильный путь:

1. поднять новую БД;
2. применить Prisma schema/migrations;
3. импортировать тестовую копию данных;
4. проверить бизнес-критичные сценарии;
5. только потом делать production migration window.

## 2. Чем переносить данные

Наиболее безопасная базовая стратегия:

- схема: Prisma migrations или SQL
- данные: `pg_dump` + `pg_restore` или собственные import scripts

Почему это нормально:

- Supabase использует PostgreSQL;
- целевая БД тоже PostgreSQL;
- значит перенос технически проще, чем между разными СУБД.

## 3. Что экспортировать

Нужно экспортировать:

- schema snapshot
- data snapshot
- counts по таблицам
- выборочные контрольные выборки

Минимальный контрольный набор перед переносом:

- число клиентов
- число записей
- число услуг
- число feedback responses
- число feedback tokens
- число client discounts
- число client portal links
- число push subscriptions
- число recommendation jobs

## 4. Порядок миграции данных

Правильный порядок:

1. `users`
2. `categories`
3. `services`
4. `clients`
5. `discount_rules`
6. `appointments`
7. `feedback_tokens`
8. `feedback_responses`
9. `client_discounts`
10. `recommendation_prompts`
11. `ai_recommendations`
12. `recommendation_jobs`
13. `client_portal_profiles`
14. `client_portal_invites`
15. `client_portal_links`
16. `push_subscriptions`
17. `owner_notification_settings`
18. `appointment_reminders`
19. `refresh_tokens` уже в новой системе

## 5. Самые чувствительные данные

Особое внимание:

- `appointments`
- `client_discounts`
- `feedback_tokens`
- `client_portal_links`
- `client_portal_invites`

## 6. Strategy: mirror first, improve later

На первом этапе не надо:

- нормализовывать все поля заново;
- менять форматы дат;
- менять UUID;
- объединять таблицы;
- придумывать новую модель скидок.

Сначала:

- зеркалим текущую систему.

Потом:

- улучшаем.

## 7. Migration scripts

Cursor должен подготовить:

### Export scripts

- schema export
- data export
- контрольные counts

### Import scripts

- загрузка по dependency order
- transaction-safe import, где возможно
- post-import validation

### Validation scripts

- counts совпадают
- orphan rows отсутствуют
- уникальные ключи соблюдены
- nullable поля не сломаны

## 8. Что проверять после импорта

### Structural checks

- количество строк по ключевым таблицам
- число foreign keys без orphan
- число invites
- число active discounts
- число reminders

### Business checks

Проверить руками:

- у клиента открываются его записи
- скидка применяется к нужной услуге
- feedback token валиден
- feedback submit создает response
- completion корректно завершает визит
- client portal links не потеряны

### Auth checks

- owner login
- client portal login
- invite activation
- reset password

## 9. Dual-run подход

Самый безопасный сценарий:

- сначала backend работает на новой БД в staging
- frontend в production еще сидит на Supabase
- вы вручную сравниваете результаты по ключевым flows

## 10. Production cutover plan

Рекомендуемый порядок:

1. объявить maintenance window;
2. временно заморозить критичные write flows;
3. сделать финальный data snapshot;
4. прогнать финальный import;
5. переключить backend env на новую БД;
6. переключить frontend на новый API;
7. прогнать smoke test;
8. держать rollback окно.

## 11. Что должно входить в smoke test

После cutover минимум проверить:

- owner login
- clients CRUD
- categories CRUD
- services CRUD
- create appointment
- edit appointment
- cancel appointment
- complete appointment
- create manual discount
- apply service-scoped discount
- feedback link generation
- feedback submit
- client invite
- client login
- client appointments list
- client discounts list
- push subscribe
- test push

## 12. Rollback plan

Rollback должен быть описан заранее.

Минимум:

- старые Supabase env не удалять заранее
- старый frontend transport не удалять заранее
- иметь последний рабочий deployment
- иметь возможность вернуть frontend на старый backend

## 13. Что нельзя делать в cutover день

Нельзя:

- одновременно менять домен
- одновременно делать редизайн
- одновременно менять AI providers
- одновременно переписывать cron architecture

В день cutover должен меняться только backend/data path.

## 14. Критерий успешной миграции данных

Можно считать data migration успешной только если:

- counts совпали;
- ключевые ручные проверки прошли;
- ни один критичный flow не потерял данные;
- rollback plan больше не нужен срочно.
