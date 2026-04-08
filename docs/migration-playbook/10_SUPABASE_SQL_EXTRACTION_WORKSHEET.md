# 10. Supabase SQL Extraction Worksheet

Этот файл для поэтапной выгрузки всего, что нужно для безопасной миграции с Supabase.

Как работать:

1. Копируй SQL из блока.
2. Выполняй в Supabase SQL Editor.
3. Вставляй результат под блоком в секцию `Ответ`.
4. Идем по порядку, ничего не пропускаем.

---

## Блок 1. Версия PostgreSQL и базовый контекст

### SQL
```sql
select version();
show server_version;
show search_path;
```

### Ответ
<!-- Вставь результат сюда -->

| search_path                  |
| ---------------------------- |
| "\$user", public, extensions |

---

## Блок 2. Список таблиц в `public`

### SQL
```sql
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
```

### Ответ
<!-- Вставь результат сюда -->

| table_schema | table_name                  |
| ------------ | --------------------------- |
| public       | ai_recommendations          |
| public       | appointment_reminders       |
| public       | appointments                |
| public       | categories                  |
| public       | client_discounts            |
| public       | client_portal_invites       |
| public       | client_portal_links         |
| public       | client_portal_profiles      |
| public       | clients                     |
| public       | discount_rules              |
| public       | feedback_responses          |
| public       | feedback_tokens             |
| public       | owner_notification_settings |
| public       | push_subscriptions          |
| public       | recommendation_jobs         |
| public       | recommendation_prompts      |
| public       | services                    |

---

## Блок 3. Полный список колонок по таблицам

### SQL
```sql
select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

### Ответ
<!-- Вставь результат сюда -->

| table_name             | ordinal_position | column_name                 | data_type                | udt_name    | is_nullable | column_default                                                  |
| ---------------------- | ---------------- | --------------------------- | ------------------------ | ----------- | ----------- | --------------------------------------------------------------- |
| ai_recommendations     | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| ai_recommendations     | 2                | user_id                     | uuid                     | uuid        | NO          | null                                                            |
| ai_recommendations     | 3                | period_type                 | text                     | text        | NO          | null                                                            |
| ai_recommendations     | 4                | period_from                 | date                     | date        | NO          | null                                                            |
| ai_recommendations     | 5                | period_to                   | date                     | date        | NO          | null                                                            |
| ai_recommendations     | 6                | source_count                | integer                  | int4        | NO          | 0                                                               |
| ai_recommendations     | 7                | summary                     | text                     | text        | NO          | null                                                            |
| ai_recommendations     | 8                | model_name                  | text                     | text        | YES         | null                                                            |
| ai_recommendations     | 9                | input_tokens                | integer                  | int4        | YES         | null                                                            |
| ai_recommendations     | 10               | output_tokens               | integer                  | int4        | YES         | null                                                            |
| ai_recommendations     | 11               | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| ai_recommendations     | 12               | prompt_id                   | uuid                     | uuid        | YES         | null                                                            |
| ai_recommendations     | 13               | prompt_snapshot             | text                     | text        | YES         | null                                                            |
| ai_recommendations     | 14               | prompt_id_snapshot          | uuid                     | uuid        | YES         | null                                                            |
| ai_recommendations     | 15               | prompt_name_snapshot        | text                     | text        | YES         | null                                                            |
| appointment_reminders  | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| appointment_reminders  | 2                | appointment_id              | uuid                     | uuid        | NO          | null                                                            |
| appointment_reminders  | 3                | user_id                     | uuid                     | uuid        | NO          | null                                                            |
| appointment_reminders  | 4                | offset_minutes              | integer                  | int4        | NO          | null                                                            |
| appointment_reminders  | 5                | remind_at                   | timestamp with time zone | timestamptz | NO          | null                                                            |
| appointment_reminders  | 6                | status                      | text                     | text        | NO          | 'pending'::text                                                 |
| appointment_reminders  | 7                | sent_at                     | timestamp with time zone | timestamptz | YES         | null                                                            |
| appointment_reminders  | 8                | cancelled_at                | timestamp with time zone | timestamptz | YES         | null                                                            |
| appointment_reminders  | 9                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| appointments           | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| appointments           | 2                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| appointments           | 3                | user_id                     | uuid                     | uuid        | NO          | auth.uid()                                                      |
| appointments           | 5                | client_name                 | text                     | text        | NO          | null                                                            |
| appointments           | 6                | client_phone                | text                     | text        | NO          | null                                                            |
| appointments           | 7                | service_name                | text                     | text        | NO          | null                                                            |
| appointments           | 8                | category_name               | text                     | text        | NO          | null                                                            |
| appointments           | 9                | appointment_at              | timestamp with time zone | timestamptz | YES         | null                                                            |
| appointments           | 10               | status                      | text                     | text        | NO          | null                                                            |
| appointments           | 11               | amount                      | numeric                  | numeric     | YES         | null                                                            |
| appointments           | 12               | notes                       | text                     | text        | YES         | null                                                            |
| appointments           | 14               | appointment_end             | timestamp with time zone | timestamptz | YES         | null                                                            |
| appointments           | 15               | applied_discount_id         | uuid                     | uuid        | YES         | null                                                            |
| appointments           | 16               | service_amount              | numeric                  | numeric     | YES         | null                                                            |
| appointments           | 17               | extra_amount                | numeric                  | numeric     | YES         | null                                                            |
| appointments           | 18               | discount_amount             | numeric                  | numeric     | YES         | null                                                            |
| appointments           | 19               | service_id                  | uuid                     | uuid        | YES         | null                                                            |
| categories             | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| categories             | 2                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| categories             | 3                | category_name               | text                     | text        | NO          | null                                                            |
| categories             | 4                | user_id                     | uuid                     | uuid        | NO          | auth.uid()                                                      |
| client_discounts       | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| client_discounts       | 2                | user_id                     | uuid                     | uuid        | NO          | null                                                            |
| client_discounts       | 3                | client_phone                | text                     | text        | NO          | null                                                            |
| client_discounts       | 4                | appointment_id              | uuid                     | uuid        | YES         | null                                                            |
| client_discounts       | 5                | feedback_token              | text                     | text        | YES         | null                                                            |
| client_discounts       | 6                | discount_percent            | integer                  | int4        | NO          | 5                                                               |
| client_discounts       | 7                | is_used                     | boolean                  | bool        | NO          | false                                                           |
| client_discounts       | 8                | used_at                     | timestamp with time zone | timestamptz | YES         | null                                                            |
| client_discounts       | 9                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| client_discounts       | 10               | source_type                 | text                     | text        | NO          | 'feedback'::text                                                |
| client_discounts       | 11               | note                        | text                     | text        | YES         | null                                                            |
| client_discounts       | 12               | expires_at                  | timestamp with time zone | timestamptz | YES         | null                                                            |
| client_discounts       | 13               | reserved_for_appointment_id | uuid                     | uuid        | YES         | null                                                            |
| client_discounts       | 14               | reserved_at                 | timestamp with time zone | timestamptz | YES         | null                                                            |
| client_discounts       | 15               | used_on_appointment_id      | uuid                     | uuid        | YES         | null                                                            |
| client_discounts       | 16               | service_id                  | uuid                     | uuid        | YES         | null                                                            |
| client_discounts       | 17               | service_name_snapshot       | text                     | text        | YES         | null                                                            |
| client_portal_invites  | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| client_portal_invites  | 2                | owner_user_id               | uuid                     | uuid        | NO          | null                                                            |
| client_portal_invites  | 3                | client_phone                | text                     | text        | NO          | null                                                            |
| client_portal_invites  | 4                | token_hash                  | text                     | text        | NO          | null                                                            |
| client_portal_invites  | 5                | purpose                     | text                     | text        | NO          | null                                                            |
| client_portal_invites  | 6                | expires_at                  | timestamp with time zone | timestamptz | NO          | null                                                            |
| client_portal_invites  | 7                | used_at                     | timestamp with time zone | timestamptz | YES         | null                                                            |
| client_portal_invites  | 8                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| client_portal_invites  | 9                | created_by                  | uuid                     | uuid        | NO          | null                                                            |
| client_portal_links    | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| client_portal_links    | 2                | owner_user_id               | uuid                     | uuid        | NO          | null                                                            |
| client_portal_links    | 3                | client_auth_user_id         | uuid                     | uuid        | NO          | null                                                            |
| client_portal_links    | 4                | client_id                   | uuid                     | uuid        | YES         | null                                                            |
| client_portal_links    | 5                | client_phone                | text                     | text        | NO          | null                                                            |
| client_portal_links    | 6                | is_active                   | boolean                  | bool        | NO          | true                                                            |
| client_portal_links    | 7                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| client_portal_links    | 8                | last_seen_at                | timestamp with time zone | timestamptz | YES         | null                                                            |
| client_portal_profiles | 1                | auth_user_id                | uuid                     | uuid        | NO          | null                                                            |
| client_portal_profiles | 2                | phone                       | text                     | text        | NO          | null                                                            |
| client_portal_profiles | 3                | display_name                | text                     | text        | YES         | null                                                            |
| client_portal_profiles | 4                | notifications_enabled       | boolean                  | bool        | NO          | false                                                           |
| client_portal_profiles | 5                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| client_portal_profiles | 6                | last_login_at               | timestamp with time zone | timestamptz | YES         | null                                                            |
| clients                | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| clients                | 2                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| clients                | 3                | name                        | text                     | text        | NO          | null                                                            |
| clients                | 4                | phone                       | text                     | text        | NO          | null                                                            |
| clients                | 5                | user_id                     | uuid                     | uuid        | NO          | auth.uid()                                                      |
| discount_rules         | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| discount_rules         | 2                | user_id                     | uuid                     | uuid        | NO          | null                                                            |
| discount_rules         | 3                | discount_percent            | integer                  | int4        | NO          | 5                                                               |
| discount_rules         | 4                | is_active                   | boolean                  | bool        | NO          | true                                                            |
| discount_rules         | 5                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| feedback_responses     | 1                | id                          | uuid                     | uuid        | NO          | gen_random_uuid()                                               |
| feedback_responses     | 2                | user_id                     | uuid                     | uuid        | NO          | null                                                            |
| feedback_responses     | 3                | feedback_text               | text                     | text        | NO          | null                                                            |
| feedback_responses     | 5                | created_at                  | timestamp with time zone | timestamptz | NO          | now()                                                           |
| feedback_responses     | 6                | period_bucket               | date                     | date        | NO          | (date_trunc('month'::text, timezone('utc'::text, now())))::date |

---

## Блок 4. Primary keys

### SQL
```sql
select
  tc.table_name,
  kc.column_name,
  kc.ordinal_position
from information_schema.table_constraints tc
join information_schema.key_column_usage kc
  on tc.constraint_name = kc.constraint_name
 and tc.table_schema = kc.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'PRIMARY KEY'
order by tc.table_name, kc.ordinal_position;
```

### Ответ
<!-- Вставь результат сюда -->

| table_name                  | column_name  | ordinal_position |
| --------------------------- | ------------ | ---------------- |
| ai_recommendations          | id           | 1                |
| appointment_reminders       | id           | 1                |
| appointments                | id           | 1                |
| categories                  | id           | 1                |
| client_discounts            | id           | 1                |
| client_portal_invites       | id           | 1                |
| client_portal_links         | id           | 1                |
| client_portal_profiles      | auth_user_id | 1                |
| clients                     | id           | 1                |
| discount_rules              | id           | 1                |
| feedback_responses          | id           | 1                |
| feedback_tokens             | id           | 1                |
| owner_notification_settings | user_id      | 1                |
| push_subscriptions          | id           | 1                |
| recommendation_jobs         | id           | 1                |
| recommendation_prompts      | id           | 1                |
| services                    | id           | 1                |

---

## Блок 5. Unique constraints

### SQL
```sql
select
  tc.table_name,
  tc.constraint_name,
  kc.column_name,
  kc.ordinal_position
from information_schema.table_constraints tc
join information_schema.key_column_usage kc
  on tc.constraint_name = kc.constraint_name
 and tc.table_schema = kc.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'UNIQUE'
order by tc.table_name, tc.constraint_name, kc.ordinal_position;
```

### Ответ
<!-- Вставь результат сюда -->

| table_name             | constraint_name                                            | column_name    | ordinal_position |
| ---------------------- | ---------------------------------------------------------- | -------------- | ---------------- |
| appointment_reminders  | appointment_reminders_appointment_id_offset_minutes_key    | appointment_id | 1                |
| appointment_reminders  | appointment_reminders_appointment_id_offset_minutes_key    | offset_minutes | 2                |
| appointments           | appointments_user_service_time_unique                      | user_id        | 1                |
| appointments           | appointments_user_service_time_unique                      | appointment_at | 2                |
| appointments           | appointments_user_service_time_unique                      | service_name   | 3                |
| categories             | Category_category_name_key                                 | category_name  | 1                |
| client_portal_invites  | client_portal_invites_token_hash_key                       | token_hash     | 1                |
| client_portal_profiles | client_portal_profiles_phone_key                           | phone          | 1                |
| clients                | clients_phone_key                                          | phone          | 1                |
| feedback_tokens        | feedback_tokens_token_key                                  | token          | 1                |
| push_subscriptions     | push_subscriptions_auth_user_id_owner_user_id_endpoint_key | auth_user_id   | 1                |
| push_subscriptions     | push_subscriptions_auth_user_id_owner_user_id_endpoint_key | owner_user_id  | 2                |
| push_subscriptions     | push_subscriptions_auth_user_id_owner_user_id_endpoint_key | endpoint       | 3                |

---

## Блок 6. Foreign keys

### SQL
```sql
select
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
order by source_table, tc.constraint_name, source_column;
```

### Ответ
<!-- Вставь результат сюда -->

| source_table          | source_column               | target_table           | target_column | constraint_name                                   |
| --------------------- | --------------------------- | ---------------------- | ------------- | ------------------------------------------------- |
| ai_recommendations    | prompt_id                   | recommendation_prompts | id            | ai_recommendations_prompt_id_fkey                 |
| appointment_reminders | appointment_id              | appointments           | id            | appointment_reminders_appointment_id_fkey         |
| appointments          | applied_discount_id         | client_discounts       | id            | appointments_applied_discount_id_fkey             |
| appointments          | service_id                  | services               | id            | appointments_service_id_fkey                      |
| client_discounts      | appointment_id              | appointments           | id            | client_discounts_appointment_id_fkey              |
| client_discounts      | reserved_for_appointment_id | appointments           | id            | client_discounts_reserved_for_appointment_id_fkey |
| client_discounts      | service_id                  | services               | id            | client_discounts_service_id_fkey                  |
| client_discounts      | used_on_appointment_id      | appointments           | id            | client_discounts_used_on_appointment_id_fkey      |
| client_portal_links   | client_id                   | clients                | id            | client_portal_links_client_id_fkey                |
| feedback_tokens       | appointment_id              | appointments           | id            | feedback_tokens_appointment_id_fkey               |
| recommendation_jobs   | prompt_id                   | recommendation_prompts | id            | recommendation_jobs_prompt_id_fkey                |
| recommendation_jobs   | result_id                   | ai_recommendations     | id            | recommendation_jobs_result_id_fkey                |
| services              | category_id                 | categories             | id            | services_category_id_fkey                         |

---

## Блок 7. Индексы (включая выражения)

### SQL
```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

### Ответ
<!-- Вставь результат сюда -->

| schemaname | tablename                   | indexname                                                  | indexdef                                                                                                                                                                        |
| ---------- | --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | ai_recommendations          | ai_recommendations_period_idx                              | CREATE INDEX ai_recommendations_period_idx ON public.ai_recommendations USING btree (user_id, period_type, period_from, period_to)                                              |
| public     | ai_recommendations          | ai_recommendations_pkey                                    | CREATE UNIQUE INDEX ai_recommendations_pkey ON public.ai_recommendations USING btree (id)                                                                                       |
| public     | ai_recommendations          | ai_recommendations_user_id_created_at_idx                  | CREATE INDEX ai_recommendations_user_id_created_at_idx ON public.ai_recommendations USING btree (user_id, created_at DESC)                                                      |
| public     | appointment_reminders       | appointment_reminders_appointment_id_offset_minutes_key    | CREATE UNIQUE INDEX appointment_reminders_appointment_id_offset_minutes_key ON public.appointment_reminders USING btree (appointment_id, offset_minutes)                        |
| public     | appointment_reminders       | appointment_reminders_pkey                                 | CREATE UNIQUE INDEX appointment_reminders_pkey ON public.appointment_reminders USING btree (id)                                                                                 |
| public     | appointment_reminders       | idx_appointment_reminders_pending_due                      | CREATE INDEX idx_appointment_reminders_pending_due ON public.appointment_reminders USING btree (status, remind_at) WHERE (status = 'pending'::text)                             |
| public     | appointment_reminders       | idx_appointment_reminders_user_status                      | CREATE INDEX idx_appointment_reminders_user_status ON public.appointment_reminders USING btree (user_id, status, remind_at DESC)                                                |
| public     | appointments                | appointments_appointment_at_idx                            | CREATE INDEX appointments_appointment_at_idx ON public.appointments USING btree (appointment_at)                                                                                |
| public     | appointments                | appointments_pkey                                          | CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id)                                                                                                   |
| public     | appointments                | appointments_status_idx                                    | CREATE INDEX appointments_status_idx ON public.appointments USING btree (status)                                                                                                |
| public     | appointments                | appointments_user_id_idx                                   | CREATE INDEX appointments_user_id_idx ON public.appointments USING btree (user_id)                                                                                              |
| public     | appointments                | appointments_user_no_overlap                               | CREATE INDEX appointments_user_no_overlap ON public.appointments USING gist (user_id, tstzrange(appointment_at, appointment_end, '[)'::text))                                   |
| public     | appointments                | appointments_user_service_time_unique                      | CREATE UNIQUE INDEX appointments_user_service_time_unique ON public.appointments USING btree (user_id, appointment_at, service_name)                                            |
| public     | appointments                | idx_appointments_applied_discount_id                       | CREATE INDEX idx_appointments_applied_discount_id ON public.appointments USING btree (applied_discount_id) WHERE (applied_discount_id IS NOT NULL)                              |
| public     | appointments                | idx_appointments_service_id                                | CREATE INDEX idx_appointments_service_id ON public.appointments USING btree (service_id) WHERE (service_id IS NOT NULL)                                                         |
| public     | appointments                | idx_appointments_user_appointment_at                       | CREATE INDEX idx_appointments_user_appointment_at ON public.appointments USING btree (user_id, appointment_at)                                                                  |
| public     | categories                  | Category_category_name_key                                 | CREATE UNIQUE INDEX "Category_category_name_key" ON public.categories USING btree (category_name)                                                                               |
| public     | categories                  | Category_pkey                                              | CREATE UNIQUE INDEX "Category_pkey" ON public.categories USING btree (id)                                                                                                       |
| public     | client_discounts            | client_discounts_pkey                                      | CREATE UNIQUE INDEX client_discounts_pkey ON public.client_discounts USING btree (id)                                                                                           |
| public     | client_discounts            | idx_client_discounts_expires_at_active                     | CREATE INDEX idx_client_discounts_expires_at_active ON public.client_discounts USING btree (expires_at) WHERE ((expires_at IS NOT NULL) AND (is_used = false))                  |
| public     | client_discounts            | idx_client_discounts_feedback_token_unique                 | CREATE UNIQUE INDEX idx_client_discounts_feedback_token_unique ON public.client_discounts USING btree (feedback_token) WHERE (feedback_token IS NOT NULL)                       |
| public     | client_discounts            | idx_client_discounts_reserved_for_appointment              | CREATE INDEX idx_client_discounts_reserved_for_appointment ON public.client_discounts USING btree (reserved_for_appointment_id) WHERE (reserved_for_appointment_id IS NOT NULL) |
| public     | client_discounts            | idx_client_discounts_service_id                            | CREATE INDEX idx_client_discounts_service_id ON public.client_discounts USING btree (service_id) WHERE (service_id IS NOT NULL)                                                 |
| public     | client_discounts            | idx_client_discounts_used_on_appointment                   | CREATE INDEX idx_client_discounts_used_on_appointment ON public.client_discounts USING btree (used_on_appointment_id) WHERE (used_on_appointment_id IS NOT NULL)                |
| public     | client_discounts            | idx_client_discounts_user_phone_service_active             | CREATE INDEX idx_client_discounts_user_phone_service_active ON public.client_discounts USING btree (user_id, client_phone, service_id, is_used, created_at DESC)                |
| public     | client_portal_invites       | client_portal_invites_pkey                                 | CREATE UNIQUE INDEX client_portal_invites_pkey ON public.client_portal_invites USING btree (id)                                                                                 |
| public     | client_portal_invites       | client_portal_invites_token_hash_key                       | CREATE UNIQUE INDEX client_portal_invites_token_hash_key ON public.client_portal_invites USING btree (token_hash)                                                               |
| public     | client_portal_invites       | idx_client_portal_invites_owner_phone_active               | CREATE INDEX idx_client_portal_invites_owner_phone_active ON public.client_portal_invites USING btree (owner_user_id, client_phone, expires_at) WHERE (used_at IS NULL)         |
| public     | client_portal_invites       | idx_client_portal_invites_owner_purpose_active             | CREATE INDEX idx_client_portal_invites_owner_purpose_active ON public.client_portal_invites USING btree (owner_user_id, purpose, expires_at) WHERE (used_at IS NULL)            |
| public     | client_portal_links         | client_portal_links_pkey                                   | CREATE UNIQUE INDEX client_portal_links_pkey ON public.client_portal_links USING btree (id)                                                                                     |
| public     | client_portal_links         | idx_client_portal_links_client_auth                        | CREATE INDEX idx_client_portal_links_client_auth ON public.client_portal_links USING btree (client_auth_user_id, created_at DESC)                                               |
| public     | client_portal_links         | idx_client_portal_links_owner_client_auth                  | CREATE UNIQUE INDEX idx_client_portal_links_owner_client_auth ON public.client_portal_links USING btree (owner_user_id, client_auth_user_id)                                    |
| public     | client_portal_links         | idx_client_portal_links_owner_phone                        | CREATE UNIQUE INDEX idx_client_portal_links_owner_phone ON public.client_portal_links USING btree (owner_user_id, client_phone)                                                 |
| public     | client_portal_profiles      | client_portal_profiles_phone_key                           | CREATE UNIQUE INDEX client_portal_profiles_phone_key ON public.client_portal_profiles USING btree (phone)                                                                       |
| public     | client_portal_profiles      | client_portal_profiles_pkey                                | CREATE UNIQUE INDEX client_portal_profiles_pkey ON public.client_portal_profiles USING btree (auth_user_id)                                                                     |
| public     | clients                     | clients_phone_key                                          | CREATE UNIQUE INDEX clients_phone_key ON public.clients USING btree (phone)                                                                                                     |
| public     | clients                     | clients_pkey                                               | CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id)                                                                                                             |
| public     | discount_rules              | discount_rules_pkey                                        | CREATE UNIQUE INDEX discount_rules_pkey ON public.discount_rules USING btree (id)                                                                                               |
| public     | discount_rules              | idx_discount_rules_one_active_per_user                     | CREATE UNIQUE INDEX idx_discount_rules_one_active_per_user ON public.discount_rules USING btree (user_id) WHERE (is_active = true)                                              |
| public     | discount_rules              | idx_discount_rules_user_created_at                         | CREATE INDEX idx_discount_rules_user_created_at ON public.discount_rules USING btree (user_id, created_at DESC)                                                                 |
| public     | feedback_responses          | feedback_responses_period_bucket_idx                       | CREATE INDEX feedback_responses_period_bucket_idx ON public.feedback_responses USING btree (period_bucket)                                                                      |
| public     | feedback_responses          | feedback_responses_pkey                                    | CREATE UNIQUE INDEX feedback_responses_pkey ON public.feedback_responses USING btree (id)                                                                                       |
| public     | feedback_responses          | feedback_responses_user_id_created_at_idx                  | CREATE INDEX feedback_responses_user_id_created_at_idx ON public.feedback_responses USING btree (user_id, created_at DESC)                                                      |
| public     | feedback_responses          | idx_feedback_responses_user_period_bucket                  | CREATE INDEX idx_feedback_responses_user_period_bucket ON public.feedback_responses USING btree (user_id, period_bucket)                                                        |
| public     | feedback_tokens             | feedback_tokens_expires_at_idx                             | CREATE INDEX feedback_tokens_expires_at_idx ON public.feedback_tokens USING btree (expires_at)                                                                                  |
| public     | feedback_tokens             | feedback_tokens_pkey                                       | CREATE UNIQUE INDEX feedback_tokens_pkey ON public.feedback_tokens USING btree (id)                                                                                             |
| public     | feedback_tokens             | feedback_tokens_token_key                                  | CREATE UNIQUE INDEX feedback_tokens_token_key ON public.feedback_tokens USING btree (token)                                                                                     |
| public     | feedback_tokens             | feedback_tokens_user_id_idx                                | CREATE INDEX feedback_tokens_user_id_idx ON public.feedback_tokens USING btree (user_id)                                                                                        |
| public     | feedback_tokens             | idx_feedback_tokens_appointment_id                         | CREATE INDEX idx_feedback_tokens_appointment_id ON public.feedback_tokens USING btree (appointment_id)                                                                          |
| public     | owner_notification_settings | owner_notification_settings_pkey                           | CREATE UNIQUE INDEX owner_notification_settings_pkey ON public.owner_notification_settings USING btree (user_id)                                                                |
| public     | push_subscriptions          | idx_push_subscriptions_auth_user                           | CREATE INDEX idx_push_subscriptions_auth_user ON public.push_subscriptions USING btree (auth_user_id, created_at DESC)                                                          |
| public     | push_subscriptions          | idx_push_subscriptions_owner_audience                      | CREATE INDEX idx_push_subscriptions_owner_audience ON public.push_subscriptions USING btree (owner_user_id, audience, created_at DESC)                                          |
| public     | push_subscriptions          | push_subscriptions_auth_user_id_owner_user_id_endpoint_key | CREATE UNIQUE INDEX push_subscriptions_auth_user_id_owner_user_id_endpoint_key ON public.push_subscriptions USING btree (auth_user_id, owner_user_id, endpoint)                 |
| public     | push_subscriptions          | push_subscriptions_pkey                                    | CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id)                                                                                       |
| public     | recommendation_jobs         | recommendation_jobs_pkey                                   | CREATE UNIQUE INDEX recommendation_jobs_pkey ON public.recommendation_jobs USING btree (id)                                                                                     |
| public     | recommendation_jobs         | recommendation_jobs_user_period_idx                        | CREATE INDEX recommendation_jobs_user_period_idx ON public.recommendation_jobs USING btree (user_id, period_type, period_from, period_to)                                       |
| public     | recommendation_jobs         | recommendation_jobs_user_status_requested_idx              | CREATE INDEX recommendation_jobs_user_status_requested_idx ON public.recommendation_jobs USING btree (user_id, status, requested_at DESC)                                       |
| public     | recommendation_prompts      | recommendation_prompts_pkey                                | CREATE UNIQUE INDEX recommendation_prompts_pkey ON public.recommendation_prompts USING btree (id)                                                                               |
| public     | recommendation_prompts      | recommendation_prompts_user_default_idx                    | CREATE INDEX recommendation_prompts_user_default_idx ON public.recommendation_prompts USING btree (user_id, is_default, created_at DESC)                                        |
| public     | services                    | services_pkey                                              | CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id)                                                                                                           |

---

## Блок 8. Check constraints

### SQL
```sql
select
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and contype = 'c'
order by conrelid::regclass::text, conname;
```

### Ответ
<!-- Вставь результат сюда -->

| table_name            | constraint_name                               | definition                                                                                                                        |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ai_recommendations    | ai_recommendations_period_type_check          | CHECK ((period_type = ANY (ARRAY['week'::text, 'month'::text, '3m'::text, '6m'::text, '9m'::text, '12m'::text, 'custom'::text]))) |
| ai_recommendations    | ai_recommendations_source_count_check         | CHECK ((source_count >= 0))                                                                                                       |
| ai_recommendations    | ai_recommendations_summary_check              | CHECK ((char_length(TRIM(BOTH FROM summary)) > 0))                                                                                |
| appointment_reminders | appointment_reminders_status_check            | CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'cancelled'::text])))                                                  |
| appointments          | appointments_end_after_start                  | CHECK (((appointment_end IS NULL) OR (appointment_at IS NULL) OR (appointment_end > appointment_at)))                             |
| appointments          | appointments_status_check                     | CHECK ((status = ANY (ARRAY['booked'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))                             |
| client_discounts      | client_discounts_discount_percent_check       | CHECK (((discount_percent >= 1) AND (discount_percent <= 100)))                                                                   |
| client_discounts      | client_discounts_source_type_check            | CHECK ((source_type = ANY (ARRAY['feedback'::text, 'manual'::text])))                                                             |
| client_portal_invites | client_portal_invites_purpose_check           | CHECK ((purpose = ANY (ARRAY['activation'::text, 'password_reset'::text])))                                                       |
| discount_rules        | discount_rules_discount_percent_check         | CHECK (((discount_percent >= 1) AND (discount_percent <= 100)))                                                                   |
| feedback_responses    | feedback_responses_feedback_text_check        | CHECK ((char_length(TRIM(BOTH FROM feedback_text)) > 0))                                                                          |
| feedback_responses    | feedback_responses_score_booking_check        | CHECK (((score_booking >= 1) AND (score_booking <= 5)))                                                                           |
| feedback_responses    | feedback_responses_score_comfort_check        | CHECK (((score_comfort >= 1) AND (score_comfort <= 5)))                                                                           |
| feedback_responses    | feedback_responses_score_explanation_check    | CHECK (((score_explanation >= 1) AND (score_explanation <= 5)))                                                                   |
| feedback_responses    | feedback_responses_score_recommendation_check | CHECK (((score_recommendation >= 1) AND (score_recommendation <= 5)))                                                             |
| feedback_responses    | feedback_responses_score_result_check         | CHECK (((score_result >= 1) AND (score_result <= 5)))                                                                             |
| push_subscriptions    | push_subscriptions_audience_check             | CHECK ((audience = ANY (ARRAY['owner'::text, 'client'::text])))                                                                   |
| recommendation_jobs   | recommendation_jobs_status_check              | CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'succeeded'::text, 'failed'::text])))                                |

---

## Блок 9. Триггеры на `public` таблицах

### SQL
```sql
select
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

### Ответ
<!-- Вставь результат сюда -->

Success. No rows returned

---

## Блок 10. SQL-функции в `public`

### SQL
```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as returns,
  pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```

### Ответ
<!-- Вставь результат сюда -->

| schema_name | function_name               | args                                                | returns          | function_def                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | --------------------------- | --------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public      | cash_dist                   | money, money                                        | money            | CREATE OR REPLACE FUNCTION public.cash_dist(money, money)
 RETURNS money
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$cash_dist$function$
                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public      | cleanup_recommendation_jobs | retention interval                                  | integer          | CREATE OR REPLACE FUNCTION public.cleanup_recommendation_jobs(retention interval DEFAULT '30 days'::interval)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  deleted_count integer;
begin
  delete from public.recommendation_jobs
   where status in ('succeeded', 'failed')
     and coalesce(finished_at, requested_at) < now() - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$
                                                                                      |
| public      | create_feedback_token       | p_expires_in interval                               | text             | CREATE OR REPLACE FUNCTION public.create_feedback_token(p_expires_in interval DEFAULT '14 days'::interval)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.feedback_tokens(user_id, token, expires_at)
  values (v_user_id, v_token, now() + p_expires_in);

  return v_token;
end;
$function$
 |
| public      | date_dist                   | date, date                                          | integer          | CREATE OR REPLACE FUNCTION public.date_dist(date, date)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$date_dist$function$
                                                                                                                                                                                                                                                                                                                                                                                                                      |
| public      | float4_dist                 | real, real                                          | real             | CREATE OR REPLACE FUNCTION public.float4_dist(real, real)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float4_dist$function$
                                                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | float8_dist                 | double precision, double precision                  | double precision | CREATE OR REPLACE FUNCTION public.float8_dist(double precision, double precision)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$float8_dist$function$
                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_bit_compress            | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_bit_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | gbt_bit_consistent          | internal, bit, smallint, oid, internal              | boolean          | CREATE OR REPLACE FUNCTION public.gbt_bit_consistent(internal, bit, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                        |
| public      | gbt_bit_penalty             | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_bit_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_bit_picksplit           | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_bit_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_bit_same                | gbtreekey_var, gbtreekey_var, internal              | internal         | CREATE OR REPLACE FUNCTION public.gbt_bit_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_same$function$
                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_bit_union               | internal, internal                                  | gbtreekey_var    | CREATE OR REPLACE FUNCTION public.gbt_bit_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bit_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_bool_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_bool_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_bool_consistent         | internal, boolean, smallint, oid, internal          | boolean          | CREATE OR REPLACE FUNCTION public.gbt_bool_consistent(internal, boolean, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_bool_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_bool_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_bool_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_bool_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_bool_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_bool_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | gbt_bool_same               | gbtreekey2, gbtreekey2, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_bool_same(gbtreekey2, gbtreekey2, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_same$function$
                                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_bool_union              | internal, internal                                  | gbtreekey2       | CREATE OR REPLACE FUNCTION public.gbt_bool_union(internal, internal)
 RETURNS gbtreekey2
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gist', $function$gbt_bool_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                               |
| public      | gbt_bpchar_compress         | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_bpchar_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bpchar_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_bpchar_consistent       | internal, character, smallint, oid, internal        | boolean          | CREATE OR REPLACE FUNCTION public.gbt_bpchar_consistent(internal, character, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bpchar_consistent$function$
                                                                                                                                                                                                                                                                                                                                                            |
| public      | gbt_bytea_compress          | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_bytea_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_bytea_consistent        | internal, bytea, smallint, oid, internal            | boolean          | CREATE OR REPLACE FUNCTION public.gbt_bytea_consistent(internal, bytea, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                  |
| public      | gbt_bytea_penalty           | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_bytea_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_bytea_picksplit         | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_bytea_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | gbt_bytea_same              | gbtreekey_var, gbtreekey_var, internal              | internal         | CREATE OR REPLACE FUNCTION public.gbt_bytea_same(gbtreekey_var, gbtreekey_var, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_same$function$
                                                                                                                                                                                                                                                                                                                                                                               |
| public      | gbt_bytea_union             | internal, internal                                  | gbtreekey_var    | CREATE OR REPLACE FUNCTION public.gbt_bytea_union(internal, internal)
 RETURNS gbtreekey_var
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_bytea_union$function$
                                                                                                                                                                                                                                                                                                                                                                                            |
| public      | gbt_cash_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_cash_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_cash_consistent         | internal, money, smallint, oid, internal            | boolean          | CREATE OR REPLACE FUNCTION public.gbt_cash_consistent(internal, money, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                    |
| public      | gbt_cash_distance           | internal, money, smallint, oid, internal            | double precision | CREATE OR REPLACE FUNCTION public.gbt_cash_distance(internal, money, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_distance$function$
                                                                                                                                                                                                                                                                                                                                                               |
| public      | gbt_cash_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_cash_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_cash_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_cash_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_cash_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_cash_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_cash_same               | gbtreekey16, gbtreekey16, internal                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_cash_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_same$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_cash_union              | internal, internal                                  | gbtreekey16      | CREATE OR REPLACE FUNCTION public.gbt_cash_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_cash_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_date_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_date_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_date_consistent         | internal, date, smallint, oid, internal             | boolean          | CREATE OR REPLACE FUNCTION public.gbt_date_consistent(internal, date, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_date_distance           | internal, date, smallint, oid, internal             | double precision | CREATE OR REPLACE FUNCTION public.gbt_date_distance(internal, date, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_distance$function$
                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_date_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_date_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_date_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_date_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_date_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_date_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_date_same               | gbtreekey8, gbtreekey8, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_date_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_same$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_date_union              | internal, internal                                  | gbtreekey8       | CREATE OR REPLACE FUNCTION public.gbt_date_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_date_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_decompress              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_decompress$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_enum_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_enum_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_enum_consistent         | internal, anyenum, smallint, oid, internal          | boolean          | CREATE OR REPLACE FUNCTION public.gbt_enum_consistent(internal, anyenum, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                  |
| public      | gbt_enum_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_enum_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_enum_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_enum_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_enum_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_enum_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_enum_same               | gbtreekey8, gbtreekey8, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_enum_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_same$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_enum_union              | internal, internal                                  | gbtreekey8       | CREATE OR REPLACE FUNCTION public.gbt_enum_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_enum_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_float4_compress         | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_float4_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_float4_consistent       | internal, real, smallint, oid, internal             | boolean          | CREATE OR REPLACE FUNCTION public.gbt_float4_consistent(internal, real, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_float4_distance         | internal, real, smallint, oid, internal             | double precision | CREATE OR REPLACE FUNCTION public.gbt_float4_distance(internal, real, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_distance$function$
                                                                                                                                                                                                                                                                                                                                                            |
| public      | gbt_float4_fetch            | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_float4_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | gbt_float4_penalty          | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_float4_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_float4_picksplit        | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_float4_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_float4_same             | gbtreekey8, gbtreekey8, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_float4_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_same$function$
                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_float4_union            | internal, internal                                  | gbtreekey8       | CREATE OR REPLACE FUNCTION public.gbt_float4_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float4_union$function$
                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_float8_compress         | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_float8_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_float8_consistent       | internal, double precision, smallint, oid, internal | boolean          | CREATE OR REPLACE FUNCTION public.gbt_float8_consistent(internal, double precision, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_consistent$function$
                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_float8_distance         | internal, double precision, smallint, oid, internal | double precision | CREATE OR REPLACE FUNCTION public.gbt_float8_distance(internal, double precision, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_distance$function$
                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_float8_fetch            | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_float8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                         |
| public      | gbt_float8_penalty          | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_float8_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_float8_picksplit        | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_float8_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_float8_same             | gbtreekey16, gbtreekey16, internal                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_float8_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_same$function$
                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_float8_union            | internal, internal                                  | gbtreekey16      | CREATE OR REPLACE FUNCTION public.gbt_float8_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_float8_union$function$
                                                                                                                                                                                                                                                                                                                                                                                            |
| public      | gbt_inet_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_inet_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_inet_consistent         | internal, inet, smallint, oid, internal             | boolean          | CREATE OR REPLACE FUNCTION public.gbt_inet_consistent(internal, inet, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_inet_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_inet_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_inet_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_inet_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_inet_same               | gbtreekey16, gbtreekey16, internal                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_inet_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_same$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_inet_union              | internal, internal                                  | gbtreekey16      | CREATE OR REPLACE FUNCTION public.gbt_inet_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_inet_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_int2_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int2_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_int2_consistent         | internal, smallint, smallint, oid, internal         | boolean          | CREATE OR REPLACE FUNCTION public.gbt_int2_consistent(internal, smallint, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_int2_distance           | internal, smallint, smallint, oid, internal         | double precision | CREATE OR REPLACE FUNCTION public.gbt_int2_distance(internal, smallint, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_distance$function$
                                                                                                                                                                                                                                                                                                                                                            |
| public      | gbt_int2_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int2_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_int2_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_int2_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_int2_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_int2_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_int2_same               | gbtreekey4, gbtreekey4, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_int2_same(gbtreekey4, gbtreekey4, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_same$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_int2_union              | internal, internal                                  | gbtreekey4       | CREATE OR REPLACE FUNCTION public.gbt_int2_union(internal, internal)
 RETURNS gbtreekey4
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int2_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_int4_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int4_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_int4_consistent         | internal, integer, smallint, oid, internal          | boolean          | CREATE OR REPLACE FUNCTION public.gbt_int4_consistent(internal, integer, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                  |
| public      | gbt_int4_distance           | internal, integer, smallint, oid, internal          | double precision | CREATE OR REPLACE FUNCTION public.gbt_int4_distance(internal, integer, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_distance$function$
                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_int4_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int4_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_int4_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_int4_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_int4_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_int4_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_int4_same               | gbtreekey8, gbtreekey8, internal                    | internal         | CREATE OR REPLACE FUNCTION public.gbt_int4_same(gbtreekey8, gbtreekey8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_same$function$
                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_int4_union              | internal, internal                                  | gbtreekey8       | CREATE OR REPLACE FUNCTION public.gbt_int4_union(internal, internal)
 RETURNS gbtreekey8
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int4_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_int8_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int8_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_int8_consistent         | internal, bigint, smallint, oid, internal           | boolean          | CREATE OR REPLACE FUNCTION public.gbt_int8_consistent(internal, bigint, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                   |
| public      | gbt_int8_distance           | internal, bigint, smallint, oid, internal           | double precision | CREATE OR REPLACE FUNCTION public.gbt_int8_distance(internal, bigint, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_distance$function$
                                                                                                                                                                                                                                                                                                                                                              |
| public      | gbt_int8_fetch              | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_int8_fetch(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_fetch$function$
                                                                                                                                                                                                                                                                                                                                                                                                             |
| public      | gbt_int8_penalty            | internal, internal, internal                        | internal         | CREATE OR REPLACE FUNCTION public.gbt_int8_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_penalty$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_int8_picksplit          | internal, internal                                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_int8_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_picksplit$function$
                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | gbt_int8_same               | gbtreekey16, gbtreekey16, internal                  | internal         | CREATE OR REPLACE FUNCTION public.gbt_int8_same(gbtreekey16, gbtreekey16, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_same$function$
                                                                                                                                                                                                                                                                                                                                                                                     |
| public      | gbt_int8_union              | internal, internal                                  | gbtreekey16      | CREATE OR REPLACE FUNCTION public.gbt_int8_union(internal, internal)
 RETURNS gbtreekey16
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_int8_union$function$
                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | gbt_intv_compress           | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_intv_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_compress$function$
                                                                                                                                                                                                                                                                                                                                                                                                       |
| public      | gbt_intv_consistent         | internal, interval, smallint, oid, internal         | boolean          | CREATE OR REPLACE FUNCTION public.gbt_intv_consistent(internal, interval, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_consistent$function$
                                                                                                                                                                                                                                                                                                                                                                 |
| public      | gbt_intv_decompress         | internal                                            | internal         | CREATE OR REPLACE FUNCTION public.gbt_intv_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/btree_gist', $function$gbt_intv_decompress$function$
                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## Блок 11. RPC/функции, которые реально вызываются приложением (targeted)

### SQL
```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_feedback_token',
    'submit_feedback',
    'cleanup_recommendation_jobs'
  )
order by p.proname;
```

### Ответ
<!-- Вставь результат сюда -->
| schema_name | function_name               | args                                                                                                                                                                           | function_def                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public      | cleanup_recommendation_jobs | retention interval                                                                                                                                                             | CREATE OR REPLACE FUNCTION public.cleanup_recommendation_jobs(retention interval DEFAULT '30 days'::interval)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  deleted_count integer;
begin
  delete from public.recommendation_jobs
   where status in ('succeeded', 'failed')
     and coalesce(finished_at, requested_at) < now() - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public      | create_feedback_token       | p_expires_in interval                                                                                                                                                          | CREATE OR REPLACE FUNCTION public.create_feedback_token(p_expires_in interval DEFAULT '14 days'::interval)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.feedback_tokens(user_id, token, expires_at)
  values (v_user_id, v_token, now() + p_expires_in);

  return v_token;
end;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public      | submit_feedback             | p_token text, p_feedback_text text, p_score_result smallint, p_score_explanation smallint, p_score_comfort smallint, p_score_booking smallint, p_score_recommendation smallint | CREATE OR REPLACE FUNCTION public.submit_feedback(p_token text, p_feedback_text text, p_score_result smallint DEFAULT NULL::smallint, p_score_explanation smallint DEFAULT NULL::smallint, p_score_comfort smallint DEFAULT NULL::smallint, p_score_booking smallint DEFAULT NULL::smallint, p_score_recommendation smallint DEFAULT NULL::smallint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token feedback_tokens%rowtype;
  v_response_id uuid;
  v_appointment appointments%rowtype;
  v_discount_percent integer := 5;
  v_client_phone text;
begin
  select *
    into v_token
    from feedback_tokens
   where token = p_token
     and is_active = true
     and expires_at > now()
     and used_at is null
   limit 1;

  if v_token.id is null then
    raise exception 'Invalid or expired token';
  end if;

  if char_length(coalesce(p_feedback_text, '')) > 1000 then
    raise exception 'Feedback text too long';
  end if;

  insert into feedback_responses (
    user_id,
    feedback_text,
    score_result,
    score_explanation,
    score_comfort,
    score_booking,
    score_recommendation
  ) values (
    v_token.user_id,
    p_feedback_text,
    p_score_result,
    p_score_explanation,
    p_score_comfort,
    p_score_booking,
    p_score_recommendation
  )
  returning id into v_response_id;

  update feedback_tokens
     set is_active = false,
         used_at = now()
   where id = v_token.id;

  if v_token.appointment_id is not null then
    select *
      into v_appointment
      from appointments
     where id = v_token.appointment_id
     limit 1;

    if v_appointment.id is not null then
      v_client_phone := regexp_replace(coalesce(v_appointment.client_phone, ''), '\D', '', 'g');

      if v_client_phone ~ '^\d{10}$' then
        v_client_phone := '7' || v_client_phone;
      elsif v_client_phone ~ '^8\d{10}$' then
        v_client_phone := '7' || substring(v_client_phone from 2);
      elsif v_client_phone ~ '^7\d{10}$' then
        v_client_phone := v_client_phone;
      else
        v_client_phone := null;
      end if;

      if v_client_phone is not null then
        select discount_percent
          into v_discount_percent
          from discount_rules
         where user_id = v_token.user_id
           and is_active = true
         order by created_at desc
         limit 1;

        v_discount_percent := coalesce(v_discount_percent, 5);

        insert into client_discounts (
          user_id,
          client_phone,
          appointment_id,
          feedback_token,
          discount_percent,
          source_type,
          service_id,
          service_name_snapshot
        ) values (
          v_token.user_id,
          v_client_phone,
          v_appointment.id,
          v_token.token,
          v_discount_percent,
          'feedback',
          v_appointment.service_id,
          v_appointment.service_name
        )
        on conflict (feedback_token) do update
          set client_phone = excluded.client_phone,
              appointment_id = excluded.appointment_id,
              discount_percent = excluded.discount_percent,
              source_type = excluded.source_type,
              service_id = excluded.service_id,
              service_name_snapshot = excluded.service_name_snapshot;
      end if;
    end if;
  end if;

  return v_response_id::text;
end;
$function$
 |
---

## Блок 12. RLS: включена ли на таблицах

### SQL
```sql
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
from pg_tables
where schemaname = 'public'
order by tablename;
```

### Ответ
<!-- Вставь результат сюда -->

Error: Failed to run sql query: ERROR: 42703: column "forcerowsecurity" does not exist LINE 5: forcerowsecurity as rls_forced ^

Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.

---

## Блок 13. RLS policies (детально)

### SQL
```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### Ответ
<!-- Вставь результат сюда -->

| schemaname | tablename                   | policyname                              | permissive | roles           | cmd    | qual                                                                 | with_check                                                           |
| ---------- | --------------------------- | --------------------------------------- | ---------- | --------------- | ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| public     | ai_recommendations          | ai_recommendations_owner_all            | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | appointment_reminders       | appointment_reminders_owner_access      | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | appointments                | appointments policy                     | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | categories                  | categories                              | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | client_discounts            | client_discounts_owner_access           | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | client_portal_invites       | client_portal_invites_owner_access      | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = owner_user_id)                                         | (auth.uid() = owner_user_id)                                         |
| public     | client_portal_links         | client_portal_links_access              | PERMISSIVE | {authenticated} | ALL    | ((auth.uid() = client_auth_user_id) OR (auth.uid() = owner_user_id)) | ((auth.uid() = client_auth_user_id) OR (auth.uid() = owner_user_id)) |
| public     | client_portal_profiles      | client_portal_profiles_self_access      | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = auth_user_id)                                          | (auth.uid() = auth_user_id)                                          |
| public     | clients                     | clients                                 | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | discount_rules              | discount_rules_owner_access             | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | feedback_responses          | feedback_responses_owner_delete         | PERMISSIVE | {authenticated} | DELETE | (auth.uid() = user_id)                                               | null                                                                 |
| public     | feedback_responses          | feedback_responses_owner_select         | PERMISSIVE | {authenticated} | SELECT | (auth.uid() = user_id)                                               | null                                                                 |
| public     | feedback_tokens             | feedback_tokens_owner_all               | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | owner_notification_settings | owner_notification_settings_self_access | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | push_subscriptions          | push_subscriptions_self_access          | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = auth_user_id)                                          | (auth.uid() = auth_user_id)                                          |
| public     | recommendation_jobs         | recommendation_jobs_owner_all           | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | recommendation_prompts      | recommendation_prompts_owner_all        | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |
| public     | services                    | services  policy                        | PERMISSIVE | {authenticated} | ALL    | (auth.uid() = user_id)                                               | (auth.uid() = user_id)                                               |

---

## Блок 14. Grants/права на таблицы

### SQL
```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
order by table_name, grantee, privilege_type;
```

### Ответ
<!-- Вставь результат сюда -->

| table_schema | table_name            | grantee       | privilege_type |
| ------------ | --------------------- | ------------- | -------------- |
| public       | ai_recommendations    | anon          | DELETE         |
| public       | ai_recommendations    | anon          | INSERT         |
| public       | ai_recommendations    | anon          | REFERENCES     |
| public       | ai_recommendations    | anon          | SELECT         |
| public       | ai_recommendations    | anon          | TRIGGER        |
| public       | ai_recommendations    | anon          | TRUNCATE       |
| public       | ai_recommendations    | anon          | UPDATE         |
| public       | ai_recommendations    | authenticated | DELETE         |
| public       | ai_recommendations    | authenticated | INSERT         |
| public       | ai_recommendations    | authenticated | REFERENCES     |
| public       | ai_recommendations    | authenticated | SELECT         |
| public       | ai_recommendations    | authenticated | TRIGGER        |
| public       | ai_recommendations    | authenticated | TRUNCATE       |
| public       | ai_recommendations    | authenticated | UPDATE         |
| public       | ai_recommendations    | postgres      | DELETE         |
| public       | ai_recommendations    | postgres      | INSERT         |
| public       | ai_recommendations    | postgres      | REFERENCES     |
| public       | ai_recommendations    | postgres      | SELECT         |
| public       | ai_recommendations    | postgres      | TRIGGER        |
| public       | ai_recommendations    | postgres      | TRUNCATE       |
| public       | ai_recommendations    | postgres      | UPDATE         |
| public       | ai_recommendations    | service_role  | DELETE         |
| public       | ai_recommendations    | service_role  | INSERT         |
| public       | ai_recommendations    | service_role  | REFERENCES     |
| public       | ai_recommendations    | service_role  | SELECT         |
| public       | ai_recommendations    | service_role  | TRIGGER        |
| public       | ai_recommendations    | service_role  | TRUNCATE       |
| public       | ai_recommendations    | service_role  | UPDATE         |
| public       | appointment_reminders | anon          | DELETE         |
| public       | appointment_reminders | anon          | INSERT         |
| public       | appointment_reminders | anon          | REFERENCES     |
| public       | appointment_reminders | anon          | SELECT         |
| public       | appointment_reminders | anon          | TRIGGER        |
| public       | appointment_reminders | anon          | TRUNCATE       |
| public       | appointment_reminders | anon          | UPDATE         |
| public       | appointment_reminders | authenticated | DELETE         |
| public       | appointment_reminders | authenticated | INSERT         |
| public       | appointment_reminders | authenticated | REFERENCES     |
| public       | appointment_reminders | authenticated | SELECT         |
| public       | appointment_reminders | authenticated | TRIGGER        |
| public       | appointment_reminders | authenticated | TRUNCATE       |
| public       | appointment_reminders | authenticated | UPDATE         |
| public       | appointment_reminders | postgres      | DELETE         |
| public       | appointment_reminders | postgres      | INSERT         |
| public       | appointment_reminders | postgres      | REFERENCES     |
| public       | appointment_reminders | postgres      | SELECT         |
| public       | appointment_reminders | postgres      | TRIGGER        |
| public       | appointment_reminders | postgres      | TRUNCATE       |
| public       | appointment_reminders | postgres      | UPDATE         |
| public       | appointment_reminders | service_role  | DELETE         |
| public       | appointment_reminders | service_role  | INSERT         |
| public       | appointment_reminders | service_role  | REFERENCES     |
| public       | appointment_reminders | service_role  | SELECT         |
| public       | appointment_reminders | service_role  | TRIGGER        |
| public       | appointment_reminders | service_role  | TRUNCATE       |
| public       | appointment_reminders | service_role  | UPDATE         |
| public       | appointments          | anon          | DELETE         |
| public       | appointments          | anon          | INSERT         |
| public       | appointments          | anon          | REFERENCES     |
| public       | appointments          | anon          | SELECT         |
| public       | appointments          | anon          | TRIGGER        |
| public       | appointments          | anon          | TRUNCATE       |
| public       | appointments          | anon          | UPDATE         |
| public       | appointments          | authenticated | DELETE         |
| public       | appointments          | authenticated | INSERT         |
| public       | appointments          | authenticated | REFERENCES     |
| public       | appointments          | authenticated | SELECT         |
| public       | appointments          | authenticated | TRIGGER        |
| public       | appointments          | authenticated | TRUNCATE       |
| public       | appointments          | authenticated | UPDATE         |
| public       | appointments          | postgres      | DELETE         |
| public       | appointments          | postgres      | INSERT         |
| public       | appointments          | postgres      | REFERENCES     |
| public       | appointments          | postgres      | SELECT         |
| public       | appointments          | postgres      | TRIGGER        |
| public       | appointments          | postgres      | TRUNCATE       |
| public       | appointments          | postgres      | UPDATE         |
| public       | appointments          | service_role  | DELETE         |
| public       | appointments          | service_role  | INSERT         |
| public       | appointments          | service_role  | REFERENCES     |
| public       | appointments          | service_role  | SELECT         |
| public       | appointments          | service_role  | TRIGGER        |
| public       | appointments          | service_role  | TRUNCATE       |
| public       | appointments          | service_role  | UPDATE         |
| public       | categories            | anon          | DELETE         |
| public       | categories            | anon          | INSERT         |
| public       | categories            | anon          | REFERENCES     |
| public       | categories            | anon          | SELECT         |
| public       | categories            | anon          | TRIGGER        |
| public       | categories            | anon          | TRUNCATE       |
| public       | categories            | anon          | UPDATE         |
| public       | categories            | authenticated | DELETE         |
| public       | categories            | authenticated | INSERT         |
| public       | categories            | authenticated | REFERENCES     |
| public       | categories            | authenticated | SELECT         |
| public       | categories            | authenticated | TRIGGER        |
| public       | categories            | authenticated | TRUNCATE       |
| public       | categories            | authenticated | UPDATE         |
| public       | categories            | postgres      | DELETE         |
| public       | categories            | postgres      | INSERT         |

---

## Блок 15. Grants/права на функции

### SQL
```sql
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
order by routine_name, grantee, privilege_type;
```

### Ответ
<!-- Вставь результат сюда -->

| routine_schema | routine_name                | grantee       | privilege_type |
| -------------- | --------------------------- | ------------- | -------------- |
| public         | cash_dist                   | PUBLIC        | EXECUTE        |
| public         | cash_dist                   | anon          | EXECUTE        |
| public         | cash_dist                   | authenticated | EXECUTE        |
| public         | cash_dist                   | postgres      | EXECUTE        |
| public         | cash_dist                   | service_role  | EXECUTE        |
| public         | cleanup_recommendation_jobs | PUBLIC        | EXECUTE        |
| public         | cleanup_recommendation_jobs | anon          | EXECUTE        |
| public         | cleanup_recommendation_jobs | authenticated | EXECUTE        |
| public         | cleanup_recommendation_jobs | postgres      | EXECUTE        |
| public         | cleanup_recommendation_jobs | service_role  | EXECUTE        |
| public         | create_feedback_token       | authenticated | EXECUTE        |
| public         | create_feedback_token       | postgres      | EXECUTE        |
| public         | create_feedback_token       | service_role  | EXECUTE        |
| public         | date_dist                   | PUBLIC        | EXECUTE        |
| public         | date_dist                   | anon          | EXECUTE        |
| public         | date_dist                   | authenticated | EXECUTE        |
| public         | date_dist                   | postgres      | EXECUTE        |
| public         | date_dist                   | service_role  | EXECUTE        |
| public         | float4_dist                 | PUBLIC        | EXECUTE        |
| public         | float4_dist                 | anon          | EXECUTE        |
| public         | float4_dist                 | authenticated | EXECUTE        |
| public         | float4_dist                 | postgres      | EXECUTE        |
| public         | float4_dist                 | service_role  | EXECUTE        |
| public         | float8_dist                 | PUBLIC        | EXECUTE        |
| public         | float8_dist                 | anon          | EXECUTE        |
| public         | float8_dist                 | authenticated | EXECUTE        |
| public         | float8_dist                 | postgres      | EXECUTE        |
| public         | float8_dist                 | service_role  | EXECUTE        |
| public         | gbt_bit_compress            | PUBLIC        | EXECUTE        |
| public         | gbt_bit_compress            | anon          | EXECUTE        |
| public         | gbt_bit_compress            | authenticated | EXECUTE        |
| public         | gbt_bit_compress            | postgres      | EXECUTE        |
| public         | gbt_bit_compress            | service_role  | EXECUTE        |
| public         | gbt_bit_consistent          | PUBLIC        | EXECUTE        |
| public         | gbt_bit_consistent          | anon          | EXECUTE        |
| public         | gbt_bit_consistent          | authenticated | EXECUTE        |
| public         | gbt_bit_consistent          | postgres      | EXECUTE        |
| public         | gbt_bit_consistent          | service_role  | EXECUTE        |
| public         | gbt_bit_penalty             | PUBLIC        | EXECUTE        |
| public         | gbt_bit_penalty             | anon          | EXECUTE        |
| public         | gbt_bit_penalty             | authenticated | EXECUTE        |
| public         | gbt_bit_penalty             | postgres      | EXECUTE        |
| public         | gbt_bit_penalty             | service_role  | EXECUTE        |
| public         | gbt_bit_picksplit           | PUBLIC        | EXECUTE        |
| public         | gbt_bit_picksplit           | anon          | EXECUTE        |
| public         | gbt_bit_picksplit           | authenticated | EXECUTE        |
| public         | gbt_bit_picksplit           | postgres      | EXECUTE        |
| public         | gbt_bit_picksplit           | service_role  | EXECUTE        |
| public         | gbt_bit_same                | PUBLIC        | EXECUTE        |
| public         | gbt_bit_same                | anon          | EXECUTE        |
| public         | gbt_bit_same                | authenticated | EXECUTE        |
| public         | gbt_bit_same                | postgres      | EXECUTE        |
| public         | gbt_bit_same                | service_role  | EXECUTE        |
| public         | gbt_bit_union               | PUBLIC        | EXECUTE        |
| public         | gbt_bit_union               | anon          | EXECUTE        |
| public         | gbt_bit_union               | authenticated | EXECUTE        |
| public         | gbt_bit_union               | postgres      | EXECUTE        |
| public         | gbt_bit_union               | service_role  | EXECUTE        |
| public         | gbt_bool_compress           | PUBLIC        | EXECUTE        |
| public         | gbt_bool_compress           | anon          | EXECUTE        |
| public         | gbt_bool_compress           | authenticated | EXECUTE        |
| public         | gbt_bool_compress           | postgres      | EXECUTE        |
| public         | gbt_bool_compress           | service_role  | EXECUTE        |
| public         | gbt_bool_consistent         | PUBLIC        | EXECUTE        |
| public         | gbt_bool_consistent         | anon          | EXECUTE        |
| public         | gbt_bool_consistent         | authenticated | EXECUTE        |
| public         | gbt_bool_consistent         | postgres      | EXECUTE        |
| public         | gbt_bool_consistent         | service_role  | EXECUTE        |
| public         | gbt_bool_fetch              | PUBLIC        | EXECUTE        |
| public         | gbt_bool_fetch              | anon          | EXECUTE        |
| public         | gbt_bool_fetch              | authenticated | EXECUTE        |
| public         | gbt_bool_fetch              | postgres      | EXECUTE        |
| public         | gbt_bool_fetch              | service_role  | EXECUTE        |
| public         | gbt_bool_penalty            | PUBLIC        | EXECUTE        |
| public         | gbt_bool_penalty            | anon          | EXECUTE        |
| public         | gbt_bool_penalty            | authenticated | EXECUTE        |
| public         | gbt_bool_penalty            | postgres      | EXECUTE        |
| public         | gbt_bool_penalty            | service_role  | EXECUTE        |
| public         | gbt_bool_picksplit          | PUBLIC        | EXECUTE        |
| public         | gbt_bool_picksplit          | anon          | EXECUTE        |
| public         | gbt_bool_picksplit          | authenticated | EXECUTE        |
| public         | gbt_bool_picksplit          | postgres      | EXECUTE        |
| public         | gbt_bool_picksplit          | service_role  | EXECUTE        |
| public         | gbt_bool_same               | PUBLIC        | EXECUTE        |
| public         | gbt_bool_same               | anon          | EXECUTE        |
| public         | gbt_bool_same               | authenticated | EXECUTE        |
| public         | gbt_bool_same               | postgres      | EXECUTE        |
| public         | gbt_bool_same               | service_role  | EXECUTE        |
| public         | gbt_bool_union              | PUBLIC        | EXECUTE        |
| public         | gbt_bool_union              | anon          | EXECUTE        |
| public         | gbt_bool_union              | authenticated | EXECUTE        |
| public         | gbt_bool_union              | postgres      | EXECUTE        |
| public         | gbt_bool_union              | service_role  | EXECUTE        |
| public         | gbt_bpchar_compress         | PUBLIC        | EXECUTE        |
| public         | gbt_bpchar_compress         | anon          | EXECUTE        |
| public         | gbt_bpchar_compress         | authenticated | EXECUTE        |
| public         | gbt_bpchar_compress         | postgres      | EXECUTE        |
| public         | gbt_bpchar_compress         | service_role  | EXECUTE        |
| public         | gbt_bpchar_consistent       | PUBLIC        | EXECUTE        |
| public         | gbt_bpchar_consistent       | anon          | EXECUTE        |

---

## Блок 16. Статистика объема данных по ключевым таблицам

### SQL
```sql
select 'appointments' as table_name, count(*) as row_count from public.appointments
union all
select 'clients', count(*) from public.clients
union all
select 'services', count(*) from public.services
union all
select 'categories', count(*) from public.categories
union all
select 'discount_rules', count(*) from public.discount_rules
union all
select 'client_discounts', count(*) from public.client_discounts
union all
select 'feedback_tokens', count(*) from public.feedback_tokens
union all
select 'feedback_responses', count(*) from public.feedback_responses
union all
select 'recommendation_prompts', count(*) from public.recommendation_prompts
union all
select 'recommendation_jobs', count(*) from public.recommendation_jobs
union all
select 'ai_recommendations', count(*) from public.ai_recommendations
union all
select 'client_portal_invites', count(*) from public.client_portal_invites
union all
select 'client_portal_profiles', count(*) from public.client_portal_profiles
union all
select 'client_portal_links', count(*) from public.client_portal_links
union all
select 'push_subscriptions', count(*) from public.push_subscriptions
union all
select 'owner_notification_settings', count(*) from public.owner_notification_settings
union all
select 'appointment_reminders', count(*) from public.appointment_reminders
order by table_name;
```

### Ответ
<!-- Вставь результат сюда -->

| table_name                  | row_count |
| --------------------------- | --------- |
| ai_recommendations          | 2         |
| appointment_reminders       | 1         |
| appointments                | 25        |
| categories                  | 2         |
| client_discounts            | 4         |
| client_portal_invites       | 1         |
| client_portal_links         | 1         |
| client_portal_profiles      | 1         |
| clients                     | 21        |
| discount_rules              | 0         |
| feedback_responses          | 11        |
| feedback_tokens             | 3         |
| owner_notification_settings | 1         |
| push_subscriptions          | 1         |
| recommendation_jobs         | 2         |
| recommendation_prompts      | 4         |
| services                    | 8         |

---

## Блок 17. Проверка на orphan rows (минимальный набор)

### SQL
```sql
-- reminders -> appointments
select count(*) as orphan_appointment_reminders
from public.appointment_reminders r
left join public.appointments a on a.id = r.appointment_id
where a.id is null;

-- services -> categories (если category_id не null)
select count(*) as orphan_services_categories
from public.services s
left join public.categories c on c.id = s.category_id
where s.category_id is not null and c.id is null;
```

### Ответ
<!-- Вставь результат сюда -->

| orphan_services_categories |
| -------------------------- |
| 0                          |

---

## Блок 18. Auth users метаданные (если доступно)

### SQL
```sql
select
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at
from auth.users
order by created_at desc
limit 200;
```

### Ответ
<!-- Вставь результат сюда -->

| id                                   | email                   | raw_user_meta_data                             | raw_app_meta_data                          | created_at                    |
| ------------------------------------ | ----------------------- | ---------------------------------------------- | ------------------------------------------ | ----------------------------- |
| 920099d6-f75b-4c7e-a19d-ad1d5abb6e73 | muminaexpert@yandex.com | {"role":"client_portal","email_verified":true} | {"provider":"email","providers":["email"]} | 2026-04-06 22:31:59.017321+00 |
| 4205e898-c24a-403d-b99c-9c4f4bdb724a | narikanm90@gmail.com    | {"email_verified":true}                        | {"provider":"email","providers":["email"]} | 2026-04-06 22:01:01.316622+00 |
| f986d7ad-765d-458b-8078-6ff76e156ea6 | narikanm@gmail.com      | {"email_verified":true}                        | {"provider":"email","providers":["email"]} | 2026-01-18 16:38:59.062936+00 |

---

## Блок 19. Cron jobs (если установлен pg_cron)

### SQL
```sql
select
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
from cron.job
order by jobid;
```

### Ответ
<!-- Если ошибка relation \"cron.job\" does not exist, просто напиши это сюда -->

Error: Failed to run sql query: ERROR: 42P01: relation "cron.job" does not exist LINE 10: from cron.job ^

Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.

---

## Блок 20. Финальная сводка для меня

Вставь коротко:

- Какие блоки выполнились без ошибок
- Какие блоки дали ошибки/ограничение доступа
- Что ты уже знаешь про кастомные RPC/триггеры, даже если они не попали в выборки

### Ответ
<!-- Вставь итог сюда -->

