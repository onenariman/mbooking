# План дальнейшей миграции (от текущего состояния)

Документ согласован с [migration-playbook](../migration-playbook/README.md) (`01`–`09`). **Оперативный следующий шаг** всегда смотри в [CURRENT_PLAN.md](./CURRENT_PLAN.md) — там таблица модулей и явное «что делать сейчас».

---

## Для ассистента: как пользоваться двумя файлами

| Вопрос | Где ответ |
|--------|-----------|
| Что делать **прямо сейчас** в коде? | [CURRENT_PLAN.md](./CURRENT_PLAN.md) → раздел «Для ассистента» и «Сейчас» |
| Какие модули уже есть в `backend/src/modules/`? | [CURRENT_PLAN.md](./CURRENT_PLAN.md) → таблица доменов |
| Почему такой порядок и что ещё за фазы (data, auth, infra)? | Этот файл (FORWARD_PLAN) |
| Детальные правила Cursor / smoke / appointments? | [07_CURSOR_EXECUTION_CHECKLIST.md](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md) |
| Карта будущих Nest-модулей? | [03_NEST_BACKEND_MODULE_MAP.md](../migration-playbook/03_NEST_BACKEND_MODULE_MAP.md) |

**Правило:** если пользователь говорит «продолжай миграцию / следующий шаг» без уточнений — открой **CURRENT_PLAN.md**, выполни ровно то, что в «Сейчас», затем обнови документ.

---

## 1. Что говорит playbook

Из [01_MASTER_PLAN.md](../migration-playbook/01_MASTER_PLAN.md) и [07_CURSOR_EXECUTION_CHECKLIST.md](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md):

1. Не ломать Next.js + Supabase до поэтапного cutover.
2. Nest + Prisma + PostgreSQL **рядом**; домены **по одному**.
3. После каждого домена: стабильные endpoint’ы → при согласовании **переключение фронта** → smoke (401, wrong-owner/403, валидация).
4. Auth (owner + client portal) доводить осознанно, не откладывать всё на конец без плана.
5. Перед production: rehearsal миграции данных, staging, rollback, инфра ([05](../migration-playbook/05_DATA_MIGRATION_AND_CUTOVER.md), [06](../migration-playbook/06_TIMEWEB_DEPLOYMENT_RUNBOOK.md)).

---

## 2. Где мы сейчас (фазы 01)

| Фаза (01) | Статус |
|-----------|--------|
| **A. Подготовка** | Закрыта документами playbook + [09](../migration-playbook/09_PROJECT_CODEBASE_MAP.md), SQL в [10](../migration-playbook/10_SUPABASE_SQL_EXTRACTION_WORKSHEET.md). |
| **B. Новый backend** | Сделано: Nest, Config, Prisma, Health, JWT skeleton, `/v1`. |
| **C. Prisma schema** | Сделано: модели, миграции, часть `manual_indexes.sql`; зазор GiST overlap. |
| **D. Data migration** | Не начата (методология в 05). |
| **E. Auth migration** | Частично: нет логина по БД; нет полноценного client-portal auth в Nest. |
| **F. Domain migration** | В коде реализован только **clients**; следующий по плану — **categories** (см. CURRENT_PLAN). |
| **G–I. Cutover фронта, infra, final** | Впереди. |

**Коротко:** каркас и схема готовы; **большая часть бизнес-API в Nest ещё не написана** — не путать с «backend готов».

---

## 3. Уже сделано (репозиторий)

См. актуальный список в [CURRENT_PLAN.md § Уже сделано](./CURRENT_PLAN.md); здесь дублируем смысл:

- `backend/`: Nest, Prisma, Health, auth skeleton, общие guards/утилиты.
- Один полный домен: **ClientsModule** (`backend/src/modules/clients/`).

---

## 4. Очередь backend-доменов (фаза F)

Порядок как в 01/07. Перед реализацией каждого модуля смотри зеркало в Next:

- `app/api/<домен>/route.ts` (или вложенные routes)
- `src/api/<домен>.api.ts`
- `src/schemas/...`

| # | Модуль | Риск / примечание |
|---|--------|-------------------|
| 1 | **Categories** | Текущий фокус (CURRENT_PLAN). |
| 2 | **Services** | CRUD + `categoryId`, owner-scope. |
| 3 | **Appointments** | Не плоский CRUD: статусы, completion, скидки, feedback token, reminders ([07 §4](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md), [03](../migration-playbook/03_NEST_BACKEND_MODULE_MAP.md)). |
| 4 | **Discounts** | Reserve/use, источники ([07 §5](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md)). |
| 5 | **Feedback** | Публичные токены, RPC → Nest. |
| 6 | **Client portal** | Инвайты, профили, линки ([07 §6](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md)). |
| 7 | **Push + reminders** | Подписки, dispatch; на первом этапе internal + cron ([07 §7](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md)). |
| 8 | **Recommendations** | Jobs, cleanup ([07 §8](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md)). |
| 9 | **Charts** | По необходимости ([03](../migration-playbook/03_NEST_BACKEND_MODULE_MAP.md)). |

После каждого модуля — smoke из [07 §3](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md).

---

## 5. Параллельные потоки

- **Auth (E):** `User` + пароль + refresh в БД; отдельно client-portal (`ClientAuthModule` в терминах 03).
- **Frontend cutover (G):** `src/api/*` на Nest URL; учитывать отличия путей (например `:id` vs `?id=`).
- **Data (D + I):** [05](../migration-playbook/05_DATA_MIGRATION_AND_CUTOVER.md); mapping имён Prisma ↔ Supabase.
- **Infra / ПДн:** [06](../migration-playbook/06_TIMEWEB_DEPLOYMENT_RUNBOOK.md), [08](../migration-playbook/08_RF_DATA_COMPLIANCE_CHECKLIST.md).

---

## 6. Критерии перед final switch

См. [01](../migration-playbook/01_MASTER_PLAN.md), [07 §9–10](../migration-playbook/07_CURSOR_EXECUTION_CHECKLIST.md): критичные домены на Nest, фронт без Supabase для них, цельный auth, reminders/push/recommendations со сроками, staging + rollback.

---

## 7. Ближайшие итерации (рекомендация)

1. CategoriesModule + smoke.  
2. ServicesModule + smoke.  
3. Owner auth под БД (реальные `sub` в JWT).  
4. AppointmentsModule поэтапно.  
5. Остальное по §4; cutover `src/api` для готовых доменов.

---

*При смене фазы (например, после Appointments или первого prod cutover) обнови этот файл и таблицу в CURRENT_PLAN.*
