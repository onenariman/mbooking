# 06. Timeweb Deployment Runbook

## Цель

Подготовить будущий деплой для:

- `Next.js frontend`
- `NestJS backend`
- `PostgreSQL`
- `Nginx`
- `PM2`
- `cron`

на `Timeweb Cloud Server`.

## 1. Базовый сервер

Для первого production варианта подойдет один сервер с:

- `Ubuntu LTS`
- `Node.js LTS`
- `PostgreSQL`
- `Nginx`
- `PM2`

Позже можно вынести:

- PostgreSQL отдельно
- Redis отдельно
- worker отдельно

## 2. Что подготовить до покупки сервера

Нужно заранее решить:

- основной домен
- будет ли `api.` subdomain
- где хранить бэкапы
- кто будет делать SSL renewal check
- нужен ли Redis на первом этапе

Рекомендуемый вариант:

- `app.domain.com` для Next.js
- `api.domain.com` для NestJS

## 3. Что настроить при создании сервера

Лучше сразу:

- `Ubuntu LTS`
- SSH key access
- root доступ или отдельный sudo-user

## 4. Базовый software stack на сервере

Понадобится:

- `git`
- `curl`
- `node`
- `npm` или `pnpm`
- `postgresql`
- `nginx`
- `pm2`
- `certbot`

Опционально:

- `redis`
- `ufw`
- `fail2ban`

## 5. Размещение приложений

Рекомендуемая структура:

```text
/var/www/mbooking-frontend
/var/www/mbooking-backend
```

Логи:

```text
/var/log/mbooking/
```

## 6. Runtime layout

### Вариант A. Один сервер, два node-процесса

- frontend: `next start`
- backend: `node dist/main.js`
- Nginx проксирует запросы

### Вариант B. Frontend + backend + worker

- frontend
- backend
- background worker / scheduler

Этот вариант лучше при росте, но не обязателен сразу.

## 7. PM2 layout

Минимум два процесса:

- `mbooking-frontend`
- `mbooking-backend`

Позже:

- `mbooking-worker`

## 8. Nginx layout

### Рекомендуемая схема

- `app.domain.com` -> `localhost:3000`
- `api.domain.com` -> `localhost:4000`

Почему так лучше:

- frontend и backend разделены;
- CORS и cookies проще контролировать;
- backend не нужно маскировать под Next routes.

### Что должен делать Nginx

- SSL termination
- reverse proxy
- forwarding headers
- optional gzip
- request size limits при необходимости

## 9. SSL

Для production нужен HTTPS.

Особенно важно, потому что:

- push notifications
- service worker
- secure cookies

нормально работают только при HTTPS.

## 10. PostgreSQL deployment strategy

### Вариант A. PostgreSQL на том же сервере

Плюсы:

- проще
- дешевле

Минусы:

- одна точка отказа
- shared resources

### Вариант B. PostgreSQL отдельно

Плюсы:

- лучше изоляция
- проще масштабирование

Минусы:

- сложнее
- дороже

Для первой версии проекта разумно:

- начать с PostgreSQL на том же сервере;
- потом вынести отдельно при росте.

## 11. Cron и scheduled jobs

На Timeweb уже не нужно упираться в ограничения Vercel Hobby.

Рекомендуемый старт:

- Linux cron

Примеры будущих задач:

- dispatch reminders каждую минуту
- cleanup recommendation jobs ночью
- cleanup expired invites/refresh tokens по расписанию

Позже можно перейти на:

- `@nestjs/schedule`
- `BullMQ`
- отдельный worker

## 12. Backup strategy

Нужно заранее описать:

- backup базы
- retention
- restore procedure

Минимум:

- регулярный `pg_dump`
- хранение архивов отдельно от сервера
- тестовый restore хотя бы на staging

## 13. Env strategy

### Frontend env

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

### Backend env

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `VAPID` keys
- `YANDEX_*`
- `AI_PROVIDER`
- internal cron secrets

### Что уйдет после миграции

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 14. Recommended deployment order

1. поднять сервер
2. настроить SSH
3. установить базовый софт
4. поднять PostgreSQL
5. задеплоить backend
6. задеплоить frontend
7. настроить Nginx
8. настроить SSL
9. настроить cron
10. прогнать smoke test

## 15. Observability

Минимально стоит заложить:

- backend logs
- frontend logs
- Nginx error log
- PM2 process status

## 16. Production checklist

Перед запуском на Timeweb должно быть готово:

- SSH key access
- firewall rules
- SSL
- PM2 startup
- Nginx config
- database backups
- cron jobs
- env files
- rollback plan
