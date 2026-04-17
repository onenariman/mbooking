# План: несколько мастеров в одном салоне (без отдельных кабинетов)

Цель: один аккаунт владельца (как сейчас), справочник мастеров, при записи выбор мастера, фильтрация журнала, в клиентском кабинете видно, к какому мастеру запись. Отдельные логины и кабинеты для мастеров **не делаем**.

---

## Текущее состояние (аудит)

| Область | Файлы / поведение |
|--------|-------------------|
| **Данные** | `Appointment` в [backend/prisma/schema.prisma](backend/prisma/schema.prisma) привязан к `userId` (владелец/салон). Поля мастера нет. Уникальность слота: `@@unique([userId, appointmentAt, serviceName])`. |
| **API** | [backend/src/modules/appointments](backend/src/modules/appointments): create/update DTO без мастера; [appointments.types.ts](backend/src/modules/appointments/appointments.types.ts) — ответ без мастера. |
| **Владелец: запись** | [components/Reception/AddBook/AddBook.tsx](components/Reception/AddBook/AddBook.tsx) — услуга, клиент, время; мастера нет. |
| **Владелец: список** | [components/Reception/index.tsx](components/Reception/index.tsx) — фильтры: категория услуги, статус, дата. [BookList](components/Reception/BookList/BookList.tsx) фильтрует на клиенте. |
| **Схемы фронта** | [src/schemas/books/bookSchema.ts](src/schemas/books/bookSchema.ts) — Zod для записей без мастера. |
| **Клиентский кабинет** | [app/client/(protected)/appointments/page.tsx](app/client/(protected)/appointments/page.tsx), главная — показывают услугу, время, статус; мастера нет. Данные с Nest `client/appointments` через [client/server/context.ts](client/server/context.ts). |
| **Напоминания / push** | Привязка к `userId` владельца; текст уведомлений можно дополнить именем мастера после появления поля. |

---

## Этап 1 — Модель данных и миграция

1. Добавить модель **`Staff`** (название можно синонимом «мастер» в UI):
   - `id` (uuid), `ownerUserId` (FK на `User.id` владельца-салона), `displayName` (string), `sortOrder` (int, optional), `isActive` (boolean, default true), `createdAt` / `updatedAt`.
   - Индекс `@@index([ownerUserId])`.
2. В **`Appointment`** добавить опциональный **`staffId`** (`String?` → FK на `Staff`), индекс `@@index([staffId])`.
3. **Обратная совместимость**: существующие записи остаются с `staffId = null` (или позже массово «мастер по умолчанию» — по продуктовому решению).
4. Пересмотреть **уникальность пересечений по времени**: сейчас уникальность `(userId, appointmentAt, serviceName)`. Для разных мастеров в одно время одна услуга должна быть допустима → заменить на уникальность с учётом мастера, например `(userId, staffId, appointmentAt, serviceName)` с учётом `NULL` в PostgreSQL (часто делают частичные индексы или нормализуют `staffId` в обязательный после переходного периода). Зафиксировать правило в миграции и в [appointments.service.ts](backend/src/modules/appointments/appointments.service.ts) (`rethrowOverlap` / проверки).
5. При необходимости ослабить глобальный `Client.phone @unique` в пользу `@@unique([userId, phone])` — отдельная задача, если столкнётесь с мультитенантностью; для одного владельца может подождать.

**Выход этапа:** Prisma migrate, сгенерированный клиент, сиды опционально (один тестовый мастер).

---

## Этап 2 — Backend (Nest)

1. **Модуль `staff` (или внутри существующего домена)**:
   - `GET /v1/staff` — список мастеров владельца (только активные или все — query).
   - `POST /v1/staff` — создать (displayName, sortOrder?).
   - `PATCH /v1/staff/:id` — переименовать, вкл/выкл, порядок.
   - `DELETE /v1/staff/:id` — мягкое удаление (`isActive: false`) или запрет, если есть будущие записи (политика на выбор).
   - Guards: как у остальных owner-роутов — `JwtAuthGuard` + `OwnerRoleGuard`.
2. **Appointments**:
   - В `CreateAppointmentDto` / `UpdateAppointmentDto` — опциональное или обязательное `staff_id` (по продукту: для салона логично **обязательно** после онбординга мастеров).
   - В `AppointmentResponse` и `toAppointmentResponse` — поля `staff_id`, `staff_name` (денормализация имени для списков без лишних join на клиенте) **или** только `staff_id` + отдельный join в list — предпочтительно **`staff_id` + `staff_display_name`** snapshot на момент записи, чтобы переименование мастера не меняло историю (аналогично `serviceName` на записи).
3. **Клиентский портал**:
   - [client-portal-context.service.ts](backend/src/modules/client-portal/client-portal-context.service.ts) — в выдаче записей добавить отображение мастера (`staff_display_name` или join).
4. **Валидация**: при создании записи проверять, что `staffId` принадлежит тому же `ownerUserId`.

**Выход этапа:** e2e или ручная проверка curl/Postman для staff CRUD и записи с мастером.

---

## Этап 3 — Owner UI: страница «Мастера»

1. Маршрут, например **`/staff`** или **`/settings/masters`** (как удобнее к [PageShell](components/layout/page-shell.tsx) / навбару).
2. Таблица или карточки: имя, порядок, активен, действия (редактировать / скрыть).
3. Форма добавления мастера (имя минимум).
4. Хуки: `useStaffList`, `useCreateStaff`, … по образцу [src/hooks/clients.hooks.ts](src/hooks/clients.hooks.ts); API в [src/api](src/api) через `nestOwnerFetch`.
5. Пункт в навигации [components/Navbar](components/Navbar/index.tsx) или мобильном меню.

**Выход этапа:** мастер создаётся и отображается в списке без участия записей.

---

## Этап 4 — Ресепшен: запись и журнал

1. **AddBook** ([AddBook.tsx](components/Reception/AddBook/AddBook.tsx)): селект «Мастер» (список из `useStaffList`, только `isActive`), значение уходит в `createAppointment`.
2. **EditBook** ([EditBook.tsx](components/Reception/BookList/EditBook.tsx)): смена мастера при редактировании.
3. **ItemBook / карточка** ([ItemBook.tsx](components/Reception/BookList/ItemBook.tsx)): бейдж или строка с именем мастера; если `staff` пустой — «Не указан» или скрыть.
4. **Фильтр по мастеру**: новый компонент по аналогии [FilterCategory.tsx](components/Reception/Filters/FilterCategory.tsx), состояние в [Reception/index.tsx](components/Reception/index.tsx), передача в [BookList](components/Reception/BookList/BookList.tsx), фильтрация по `staff_id` / имени.
5. Обновить **`createAppointmentSchema`** и типы **`ZodAppointment`** в [bookSchema.ts](src/schemas/books/bookSchema.ts); цепочка [appointments.hooks.ts](src/hooks/appointments.hooks.ts) + [receptions.api / appointments.api](src/api) если разнесено.

**Выход этапа:** полный цикл «создать мастера → записать клиента на мастера → отфильтровать журнал».

---

## Этап 5 — Клиентский кабинет

1. Убедиться, что Nest `GET /v1/client/appointments` отдаёт поле мастера (см. этап 2).
2. **Схема** на фронте клиента: расширить парсинг в [client/server/context.ts](client/server/context.ts) / схемы записей, если используете Zod для клиентских данных.
3. **UI**: [app/client/(protected)/appointments/page.tsx](app/client/(protected)/appointments/page.tsx), [app/client/(protected)/page.tsx](app/client/(protected)/page.tsx) — вывести строку «Мастер: …» под услугой или рядом с бейджем; для старых записей без мастера — прочерк или не показывать.
4. Тексты карточек при необходимости скорректировать («к мастеру» уже есть частично в описаниях).

**Выход этапа:** клиент видит, к кому записан.

---

## Этап 6 — Дополнительно (по приоритету)

| Задача | Зачем |
|--------|--------|
| Push / напоминания | В теле уведомления добавить имя мастера ([push-send](backend/src/modules/push), [appointment-reminder-dispatch](backend/src/modules/push/appointment-reminder-dispatch.service.ts)). |
| Аналитика / charts | Если отчёты по услугам завязаны на записи — опционально срез «по мастеру» в [Charts](components/Charts) и API [charts/overview](app/api/charts/overview). |
| Экспорт | Когда появится выгрузка — добавить колонку мастера. |

---

## Риски и решения

| Риск | Митигация |
|------|-----------|
| Уникальный индекс слотов конфликтует с несколькими мастерами | Явно задать новое правило уникальности и обновить логику overlap в сервисе. |
| Переименование мастера меняет историю | Хранить `staff_display_name` на записи **или** только id и показывать текущее имя (продуктово: для истории чаще snapshot). |
| Пустой мастер у старых записей | Допустить `null` в UI и в отчётах «Не указано». |

---

## Порядок внедрения (кратко)

1. Prisma: `Staff` + `Appointment.staffId` + миграция индексов.  
2. Nest: CRUD staff + поля в appointments.  
3. Owner: страница мастеров + навигация.  
4. Ресепшен: формы, список, фильтр.  
5. Клиентский кабинет: отображение.  
6. Push / графики — по необходимости.

Оценка: **средняя** сложность (основной риск — миграция уникальности и overlap, не UI).
