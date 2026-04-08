# 09. Project Codebase Map

## Зачем этот документ

Этот файл нужен, чтобы `Cursor` быстро понял текущий проект:

- где лежат страницы
- где лежат UI-компоненты
- где лежит data layer
- где схемы и валидаторы
- где серверная логика
- какие файлы нельзя читать поверхностно

Это не migration-документ.  
Это карта текущего кодбейса.

## 1. Что это за проект

`mbooking` — это Next.js-приложение для записи клиентов.

Сейчас в проекте уже есть:

- админская зона
- записи на прием
- клиенты
- категории
- услуги
- скидки
- feedback flow
- AI recommendations
- push notifications
- клиентский кабинет

## 2. Главная архитектурная идея прямо сейчас

Текущий проект еще не разделен на frontend/backend в классическом смысле.

Сейчас архитектура такая:

- `Next.js app router` = UI + route handlers
- `components/*` = интерфейс
- `src/api/*` = клиентский data layer
- `src/hooks/*` = TanStack Query hooks
- `app/api/*` = server endpoints
- `src/server/*` = внутренняя серверная логика
- `src/utils/supabase/*` = auth/session/db access

То есть backend-логика сейчас размазана между:

- `app/api/*`
- `src/server/*`
- `src/utils/supabase/*`

Это очень важно для будущего переноса в `NestJS`.

## 3. Ключевые папки верхнего уровня

### `app/`

Здесь лежат:

- страницы
- layouts
- public/protected маршруты
- route handlers в `app/api`

Ключевые подпапки:

- `app/api`
- `app/client`
- `app/receptions`
- `app/clients`
- `app/categories`
- `app/services`
- `app/charts`
- `app/recommendations`
- `app/feedback`
- `app/login`

Ключевые файлы:

- `app/layout.tsx`
- `app/page.tsx`
- `app/manifest.ts`

### `components/`

Здесь лежит почти весь UI по доменам.

Ключевые подпапки:

- `components/Reception`
- `components/Client`
- `components/ClientPortal`
- `components/Feedback`
- `components/Recommendations`
- `components/Charts`
- `components/Navbar`
- `components/PWA`
- `components/layout`
- `components/ui`

### `src/`

Это основной технический слой проекта.

Ключевые подпапки:

- `src/api`
- `src/hooks`
- `src/schemas`
- `src/server`
- `src/utils`
- `src/validators`
- `src/helpers`
- `src/lib`

### `supabase/`

Здесь лежат SQL-миграции текущей базы.

Ключевая папка:

- `supabase/migrations`

### `types/`

Здесь лежат типы БД.

Ключевой файл:

- `types/database.types.ts`

## 4. Где что лежит по слоям

## 4.1 Страницы и маршруты

Основные страницы лежат в `app/`.

Важные маршруты:

- `/login`
- `/receptions`
- `/clients`
- `/categories`
- `/services`
- `/charts`
- `/recommendations`
- `/feedback/[token]`
- `/client/*`

Клиентский кабинет разделен на:

- `app/client/(public)`
- `app/client/(protected)`

Это важно, потому что public/protected разделение уже есть и его нельзя ломать при миграции.

## 4.2 Route handlers

Все серверные endpoint'ы в Next лежат в:

- `app/api/*`

Это текущий псевдо-backend проекта.

Особенно важные зоны:

- `app/api/clients/route.ts`
- `app/api/categories/route.ts`
- `app/api/services/route.ts`
- `app/api/discounts/*`
- `app/api/appointments/[id]/complete/route.ts`
- `app/api/feedback/*`
- `app/api/client/*`
- `app/api/push/*`
- `app/api/recommendations/*`

## 4.3 Клиентский data layer

Клиентские вызовы API лежат в:

- `src/api/*`

Ключевые файлы:

- `src/api/appointments.api.ts`
- `src/api/categories.api.ts`
- `src/api/clients.api.ts`
- `src/api/discounts.api.ts`
- `src/api/feedback.api.ts`
- `src/api/receptions.api.ts`
- `src/api/recommendationPrompts.api.ts`
- `src/api/services.api.ts`

Важно:

- `src/api/receptions.api.ts` — одна из самых чувствительных точек, потому что там еще есть прямые завязки на текущий Supabase flow по записям.

## 4.4 TanStack Query hooks

Хуки лежат в:

- `src/hooks/*`

Ключевые файлы:

- `src/hooks/appointments.hooks.ts`
- `src/hooks/categories.hooks.ts`
- `src/hooks/clients.hooks.ts`
- `src/hooks/discounts.hooks.ts`
- `src/hooks/feedback.hooks.ts`
- `src/hooks/recommendationPrompts.hooks.ts`
- `src/hooks/services.hook.ts`

Роль этого слоя:

- он связывает UI и `src/api/*`
- при переносе на NestJS его часто можно оставить почти без изменений, меняя только transport

## 4.5 Схемы и валидация

Схемы лежат в:

- `src/schemas/*`

Подпапки:

- `src/schemas/books`
- `src/schemas/categories`
- `src/schemas/client-portal`
- `src/schemas/clients`
- `src/schemas/discounts`
- `src/schemas/feedback`
- `src/schemas/services`

Валидаторы лежат в:

- `src/validators/*`

Ключевые файлы:

- `src/validators/normalizePhone.ts`
- `src/validators/formatNameInput.ts`
- `src/validators/formatPriceInput.ts`

Телефонная нормализация — это критичная часть бизнеса, особенно для:

- клиентов
- скидок
- client portal

## 4.6 Серверная доменная логика

Серверная логика, вынесенная из route handlers, лежит в:

- `src/server/*`

Ключевые подпапки:

- `src/server/client-portal`
- `src/server/push`

Ключевые файлы:

- `src/server/client-portal/invitations.ts`
- `src/server/client-portal/context.ts`
- `src/server/push/sendPush.ts`
- `src/server/push/reminders.ts`
- `src/server/push/appointments.ts`

Это очень важный слой:

- именно его потом проще всего переносить в Nest services

## 4.7 Supabase layer

Критичные файлы:

- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `src/utils/supabase/admin.ts`
- `src/utils/supabase/env.ts`
- `src/utils/supabase/middleware.ts`
- `proxy.ts`

Роль этого слоя:

- browser client
- server client
- admin/service-role client
- SSR session
- route protection

Если Cursor не понимает этот слой, он почти наверняка сломает auth или client portal.

## 5. Где лежит UI по доменам

## 5.1 Записи

Основная UI-зона записей:

- `components/Reception/AddBook`
- `components/Reception/BookList`
- `components/Reception/Filters`
- `components/Reception/Statistic`

Это одна из самых больших и чувствительных зон интерфейса.

## 5.2 Клиенты

Клиентский админский UI:

- `components/Client/AddClient.tsx`
- `components/Client/EditClient.tsx`
- `components/Client/DeleteClient.tsx`
- `components/Client/DropdownMenuClient.tsx`
- `components/Client/ListClient.tsx`
- `components/Client/ItemClient.tsx`

## 5.3 Клиентский кабинет

Ключевые файлы:

- `components/ClientPortal/ClientLoginForm.tsx`
- `components/ClientPortal/ClientInviteActivationForm.tsx`
- `components/ClientPortal/ClientLogoutButton.tsx`
- `components/ClientPortal/ClientPortalHeader.tsx`
- `components/ClientPortal/ClientSettingsForm.tsx`

## 5.4 PWA / push

Ключевая папка:

- `components/PWA`

Это слой UI для:

- включения push
- настройки reminder intervals

## 6. В каком порядке Cursor должен читать проект

Если Cursor заходит в проект впервые, лучший порядок чтения такой:

1. `package.json`
2. `types/database.types.ts`
3. `docs/ARCHITECTURE.md`
4. `proxy.ts`
5. `src/utils/supabase/*`
6. `app/api/*`
7. `src/server/*`
8. `src/api/*`
9. `src/hooks/*`
10. `components/*`

Если задача касается client portal:

1. `src/utils/supabase/middleware.ts`
2. `src/server/client-portal/*`
3. `app/api/client/*`
4. `app/client/*`
5. `components/ClientPortal/*`

Если задача касается записей:

1. `src/api/receptions.api.ts`
2. `app/api/appointments/[id]/complete/route.ts`
3. `components/Reception/*`
4. `src/hooks/appointments.hooks.ts`

Если задача касается push:

1. `src/server/push/*`
2. `app/api/push/*`
3. `components/PWA/*`

## 7. Самые чувствительные зоны проекта

Cursor должен особенно аккуратно читать и менять:

- `src/utils/supabase/middleware.ts`
- `src/server/client-portal/invitations.ts`
- `src/server/client-portal/context.ts`
- `src/server/push/reminders.ts`
- `src/api/receptions.api.ts`
- `app/api/appointments/[id]/complete/route.ts`
- `app/api/feedback/submit/route.ts`
- `app/api/client/invitations/*`

Потому что именно здесь сейчас больше всего бизнес-логики, auth и side effects.

## 8. Что не надо делать Cursor без полного контекста

Нельзя:

- сходу переписывать `middleware`
- менять phone normalization "для красоты"
- упрощать скидки до одной таблицы без понимания flows
- трогать client portal auth без понимания public/protected split
- менять reminder logic без чтения `src/server/push/reminders.ts`

## 9. Короткий вывод

Текущий `mbooking` — это не просто набор страниц.

Это проект, где логика размазана по нескольким слоям:

- `app/api`
- `src/server`
- `src/api`
- `src/hooks`
- `components`
- `src/utils/supabase`

Если Cursor понимает эту карту, он не будет путаться и сможет работать с проектом аккуратно.
