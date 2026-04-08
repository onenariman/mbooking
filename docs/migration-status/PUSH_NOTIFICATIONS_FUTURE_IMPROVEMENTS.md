# Push notifications: minimal now, next later

## What is implemented in minimal version

- Owner push flow in Nest is already active (`/v1/push/*`).
- Client portal can now manage push subscriptions:
  - `POST /v1/client/push/subscribe`
  - `DELETE /v1/client/push/subscribe`
  - `POST /v1/client/push/test`
- `POST /v1/push/appointments/event` now sends:
  - owner push as before;
  - client portal push to linked active clients (`ClientPortalLink`) with `notifications_enabled=true`.

## Scope intentionally left out

- No dedicated client reminder schedule yet (only owner reminder dispatch is implemented).
- No separate client reminder settings model (offsets, channels, quiet hours).
- No delivery status analytics per recipient (only send attempt counters in API response).
- No queue/retry worker for transient push failures.

## Recommended next improvements

1. Add dedicated client reminders job:
   - either separate table (`client_appointment_reminders`) or extend existing reminders model with recipient type.
2. Add per-client notification preferences:
   - reminders enabled;
   - offsets (for example, 24h + 2h);
   - quiet hours/timezone.
3. Introduce asynchronous dispatch (queue):
   - reduce API latency;
   - retries with backoff;
   - dead-letter handling.
4. Add observability:
   - sent/failed/skipped metrics;
   - stale subscription cleanup metrics;
   - dashboard/log correlation by appointment and recipient.
5. Harden recipient resolution:
   - support multiple active links per phone where needed;
   - explicit owner-business scoping if multi-business model evolves.

## Чеклист с `curl` (готовые команды)

Писать `curl` с нуля не обязательно: ниже шаблоны. Подставь свои значения в переменные.

**Предусловия**

- Backend: `http://localhost:4000` (или свой `BASE`).
- В `.env` заданы `VAPID_*` (и при необходимости `CRON_SECRET`).
- Для **реального** `subscribe` в теле нужны настоящие `endpoint` / `keys` из `PushManager.subscribe()` в браузере — через чистый `curl` без браузера подписку не получить. Для smoke API можно вызывать только `test` после того, как подписка уже записана (через UI или заранее вставленный JSON).

**Переменные (bash)**

```bash
BASE=http://localhost:4000
# Owner JWT (skeleton login)
OWNER_TOKEN="$(curl -sS -X POST "$BASE/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.local","password":"password12"}' \
  | jq -r '.accessToken')"
# Client JWT — после activate в client portal (или вручную выписанный access)
CLIENT_TOKEN="paste-client-access-jwt-here"
APPOINTMENT_ID="uuid-записи-владельца-OWNER_TOKEN"
```

На Windows, если `curl` ведёт себя странно, вызывай `curl.exe` из PowerShell или Git Bash.

---

### 1) Здоровье API

```bash
curl -sS "$BASE/v1/health"
```

---

### 2) Owner: тест push (нужна уже сохранённая подписка `audience=owner`)

```bash
curl -sS -X POST "$BASE/v1/push/test" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидание: `200`, в теле `data.sent >= 1` или ошибка «нет подписок» / «push не настроен».

---

### 3) Owner: зарегистрировать подписку (тело из браузера)

```bash
curl -sS -X POST "$BASE/v1/push/subscribe" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/....",
      "keys": { "auth": "....", "p256dh": "...." }
    }
  }'
```

---

### 4) Client portal: подписка / отписка / тест

Подписка (тело снова из браузера клиентского кабинета):

```bash
curl -sS -X POST "$BASE/v1/client/push/subscribe" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/....",
      "keys": { "auth": "....", "p256dh": "...." }
    }
  }'
```

Тест (после subscribe):

```bash
curl -sS -X POST "$BASE/v1/client/push/test" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Отписка по `endpoint`:

```bash
curl -sS -X DELETE "$BASE/v1/client/push/subscribe" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/fcm/send/...."}'
```

---

### 5) Включить уведомления у клиента (если выключены)

```bash
curl -sS -X PATCH "$BASE/v1/client/settings" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":true}'
```

---

### 6) Событие записи: мастер + клиент (после subscribe обоих)

```bash
curl -sS -X POST "$BASE/v1/push/appointments/event" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"appointment_id\": \"$APPOINTMENT_ID\",
    \"event\": \"created\",
    \"appointment_label\": null
  }"
```

В ответе смотри `data` (owner) и `data.client_portal` (`recipients`, `sent`, …). Клиент получит пуш только если есть активный `ClientPortalLink` на телефон записи и `notifications_enabled=true`.

---

### 7) Cron: dispatch напоминаний мастеру (опционально)

Если задан `CRON_SECRET`:

```bash
CRON_SECRET="your-secret"
curl -sS -X POST "$BASE/v1/push/reminders/dispatch" \
  -H "x-cron-secret: $CRON_SECRET"
```

---

### Краткий чеклист по факту

1. `GET /v1/health` — ок.
2. Owner: `POST /v1/push/test` — пуш пришёл (или понятная ошибка).
3. Client: `PATCH settings` → `POST /v1/client/push/test` — пуш пришёл.
4. `POST /v1/push/appointments/event` — пуши у мастера и у клиента (при связке и флаге).
5. (Опц.) `POST /v1/push/reminders/dispatch` с секретом — отработал без 401.
