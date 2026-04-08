# Migration Playbook

Этот каталог описывает полный план аккуратного перехода:

- с `Supabase`
- на `NestJS + Prisma + PostgreSQL`
- с будущим деплоем на `Timeweb Cloud Server + Nginx`

Ключевой принцип миграции:

- ничего не ломаем сразу;
- сначала рядом поднимаем новый backend;
- постепенно переписываем текущую логику на `NestJS`;
- проверяем каждый домен отдельно;
- только после полного cutover убираем `Supabase`.

## Состав папки

1. `01_MASTER_PLAN.md`
2. `02_SUPABASE_INVENTORY_MAP.md`
3. `03_NEST_BACKEND_MODULE_MAP.md`
4. `04_PRISMA_SCHEMA_DRAFT.md`
5. `05_DATA_MIGRATION_AND_CUTOVER.md`
6. `06_TIMEWEB_DEPLOYMENT_RUNBOOK.md`
7. `07_CURSOR_EXECUTION_CHECKLIST.md`
8. `08_RF_DATA_COMPLIANCE_CHECKLIST.md`
9. `09_PROJECT_CODEBASE_MAP.md`

## В каком порядке читать

1. `01_MASTER_PLAN.md`
2. `02_SUPABASE_INVENTORY_MAP.md`
3. `03_NEST_BACKEND_MODULE_MAP.md`
4. `04_PRISMA_SCHEMA_DRAFT.md`
5. `05_DATA_MIGRATION_AND_CUTOVER.md`
6. `06_TIMEWEB_DEPLOYMENT_RUNBOOK.md`
7. `07_CURSOR_EXECUTION_CHECKLIST.md`
8. `08_RF_DATA_COMPLIANCE_CHECKLIST.md`
9. `09_PROJECT_CODEBASE_MAP.md`

## Главная мысль

Этот playbook не про "быстро все переписать".

Он про безопасную стратегию:

- сохранить текущий рабочий продукт;
- вынести backend в отдельный NestJS слой;
- заменить Supabase по частям;
- и только в конце переключить проект целиком.

## Основные внешние источники

- NestJS Auth: `https://docs.nestjs.com/security/authentication`
- NestJS recipes: `https://docs.nestjs.com/recipes`
- Prisma data migration: `https://www.prisma.io/docs/guides/database/data-migration`
- Prisma introspection: `https://docs.prisma.io/docs/orm/prisma-schema/introspection`
- Prisma db pull: `https://docs.prisma.io/docs/cli/db/pull`
- Timeweb Cloud Servers: `https://timeweb.cloud/docs/cloud-servers`
- Timeweb server start: `https://timeweb.cloud/docs/cloud-servers/servers-start`
- Timeweb SSH keys: `https://timeweb.cloud/docs/cloud-servers/manage-servers/ssh-keys`
- Nginx proxy docs: `https://nginx.org/en/docs/http/ngx_http_proxy_module.html`
- PostgreSQL pg_dump: `https://www.postgresql.org/docs/current/app-pgdump.html`
- PostgreSQL pg_restore: `https://www.postgresql.org/docs/current/app-pgrestore.html`
