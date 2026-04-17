# Owner «Организация» — план внедрения

Цель: добавить для owner (мастера) страницу **«Организация»** с сохранением профиля организации/владельца.

## Продуктовое поведение

- **Email**: берётся из `User.email`, отображается **только для чтения** (источник — Яндекс OAuth).
- **Опциональные поля**: `full_name`, `phone`, `inn` — можно сохранить частично.
- **Навигация**: пункт **«Организация»** в owner dropdown меню.

---

## Backend

### Prisma

Добавить 1:1 сущность к owner пользователю:

- `OwnerOrganization`
  - `id` UUID
  - `ownerUserId` UUID unique → `User.id`
  - `fullName` String?
  - `phone` String?
  - `inn` String?
  - timestamps

### API (Nest)

Owner-protected endpoints:

- `GET /v1/owner/organization`
  - возвращает `{ data: { email, full_name, phone, inn } }`
  - если записи нет — возвращает `null` поля
- `PATCH /v1/owner/organization`
  - body: `{ full_name?: string|null, phone?: string|null, inn?: string|null }`
  - upsert по `ownerUserId`

Валидация:

- `phone`: нормализация под формат `7XXXXXXXXXX` (как в client-portal) или `null`
- `inn`: только цифры; длина 10 или 12; иначе 400

---

## Frontend (Next)

### `schemas`

- `src/schemas/owner-organization/ownerOrganizationSchema.ts`
  - schema для PATCH: все поля optional, но должен быть минимум 1 ключ
  - нормализация телефона + валидация ИНН

### `api`

- `src/api/ownerOrganization.api.ts`
  - `fetchOwnerOrganization()`
  - `patchOwnerOrganization(body)`

### `hooks`

- `src/hooks/ownerOrganization.hooks.ts`
  - query key: `["owner","organization"]`
  - `useOwnerOrganization(initialData?)`
  - `usePatchOwnerOrganization()` + invalidate

### Страница + UI

- `app/organization/page.tsx` (owner protected)
- форма: email readonly + inputs ФИО/телефон/ИНН + submit

---

## Smoke test checklist

- OAuth login → редирект на `/receptions`
- Dropdown menu → «Организация» открывается
- Первый заход: GET возвращает email и `null` поля
- PATCH сохраняет по одному полю (например только ИНН)
- Валидации телефона/ИНН дают читаемую ошибку

---

## Definition of Done

- Prisma миграция применена
- Nest endpoints работают и защищены owner JWT
- На фронте есть `schemas/api/hooks` по конвенциям проекта
- Страница «Организация» доступна из навбара
- Email readonly, остальные поля опционально сохраняются

