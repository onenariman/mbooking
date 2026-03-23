# PWA Push Implementation Draft

## Назначение документа

Этот документ нужен как прикладной draft для будущей реализации push-уведомлений в проекте.

Здесь собраны:

- минимальная схема БД;
- список файлов, которые, скорее всего, появятся;
- MVP-план;
- чеклист внедрения.

## Архитектурная модель

Нужны 4 слоя:

1. PWA-слой
2. Service Worker
3. Подписки и настройки в Supabase
4. Серверная отправка push

## База данных

## 1. Таблица `push_subscriptions`

Хранит подписки конкретных устройств.

### Рекомендуемые поля

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `endpoint text not null`
- `p256dh text not null`
- `auth text not null`
- `device_label text null`
- `user_agent text null`
- `platform text null`
- `is_active boolean not null default true`
- `last_seen_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### Ограничения

- foreign key на пользователя
- уникальность по `endpoint`

## 2. Таблица `notification_preferences`

Хранит настройки пользователя.

### MVP-поля

- `user_id uuid primary key`
- `push_enabled boolean not null default true`
- `appointments_enabled boolean not null default true`
- `feedback_enabled boolean not null default true`
- `recommendations_enabled boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 3. Таблица `notification_events`

Необязательна для первого MVP, но очень полезна.

### Поля

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `subscription_id uuid null`
- `type text not null`
- `title text not null`
- `body text not null`
- `payload jsonb null`
- `status text not null`
- `sent_at timestamptz null`
- `clicked_at timestamptz null`
- `created_at timestamptz not null default now()`

## SQL draft

Ниже не финальная миграция, а стартовая схема.

```sql
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_label text,
  user_agent text,
  platform text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key,
  push_enabled boolean not null default true,
  appointments_enabled boolean not null default true,
  feedback_enabled boolean not null default true,
  recommendations_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subscription_id uuid,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb,
  status text not null,
  sent_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);
```

## RLS draft

Идея по доступам:

- пользователь читает только свои подписки;
- пользователь читает и меняет только свои настройки;
- `notification_events` пользователь читает только свои;
- серверный слой может писать все нужные записи через service role.

## Пример policy-направления

- `push_subscriptions_owner_all`
- `notification_preferences_owner_all`
- `notification_events_owner_select`

## Будущие файлы

Ниже ориентир по структуре, а не обязательные финальные пути.

## PWA

- `app/manifest.ts`
- `public/sw.js`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`

## Client helpers

- `src/lib/push/registerServiceWorker.ts`
- `src/lib/push/requestNotificationPermission.ts`
- `src/lib/push/subscribeToPush.ts`
- `src/lib/push/unsubscribeFromPush.ts`

## API routes

- `app/api/push/subscriptions/route.ts`
- `app/api/push/subscriptions/[id]/route.ts`
- `app/api/push/test/route.ts`

## Server utilities

- `src/server/push/sendPush.ts`
- `src/server/push/buildNotificationPayload.ts`
- `src/server/push/deactivateInvalidSubscription.ts`

## Hooks

- `src/hooks/push.hooks.ts`

## UI

- `components/Settings/PushNotificationsCard.tsx`
- `components/Settings/NotificationPreferencesForm.tsx`
- `components/PWA/InstallAppHint.tsx`
- `components/PWA/EnablePushButton.tsx`

## Что должно появиться в layout

В `app/layout.tsx` позже нужно будет добавить:

- manifest metadata;
- apple web app support;
- icons;
- theme color;
- при необходимости регистрацию клиентского bootstrap-компонента для service worker.

## MVP

## MVP-цель

Сделать минимальный рабочий сценарий:

- пользователь устанавливает приложение на главный экран;
- включает уведомления;
- подписка сохраняется;
- сервер умеет отправить одно тестовое уведомление;
- уведомление открывает приложение по нужному маршруту.

## MVP-события

Стартовый набор:

- `recommendation_ready`
- `appointment_tomorrow`
- `new_feedback_received`

## Порядок реализации

### Этап 1. PWA

- manifest
- icons
- standalone mode
- installability

### Этап 2. Service worker

- регистрация
- обработка `push`
- обработка `notificationclick`

### Этап 3. Supabase schema

- `push_subscriptions`
- `notification_preferences`
- при желании `notification_events`
- RLS

### Этап 4. Client subscription flow

- кнопка включения уведомлений
- request permission
- `pushManager.subscribe`
- сохранение подписки на сервере

### Этап 5. Server push sender

- VAPID keys
- тестовый endpoint отправки
- деактивация invalid subscriptions

### Этап 6. Первое бизнес-событие

- `recommendation_ready`

### Этап 7. Остальные события

- `appointment_tomorrow`
- `new_feedback_received`

## Чеклист

## Product

- определить 2-3 реально полезных push-события;
- продумать тексты уведомлений;
- продумать экран, куда ведет клик по уведомлению.

## Frontend

- сделать install prompt / hint;
- зарегистрировать service worker;
- добавить кнопку включения уведомлений;
- добавить экран настроек уведомлений.

## Backend

- сохранить подписки;
- отправлять push;
- чистить битые подписки;
- логировать события отправки.

## Supabase

- таблицы;
- RLS policies;
- типы после миграции;
- service-role доступ для отправки.

## Тестирование

- Android Chrome;
- desktop browser;
- iPhone Safari -> Add to Home Screen -> установленная web app;
- клик по уведомлению;
- повторная подписка;
- отключение уведомлений;
- невалидная подписка.

## Что не забыть

- `HTTPS` обязателен;
- permission не запрашивать автоматически на первом экране;
- нужно предусмотреть повторную подписку после переустановки или смены устройства;
- одну и ту же подписку нельзя бездумно дублировать;
- пользователь может иметь несколько активных устройств.

## Финальный ориентир

Если делать это без лишней переделки в будущем, то оптимальный путь такой:

- сначала PWA-основа;
- потом подписки;
- потом серверная отправка;
- потом 1-2 реально полезных сценария;
- и только после этого расширение до полноценной системы уведомлений.
