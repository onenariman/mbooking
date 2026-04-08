# 04. Prisma Schema Draft

## Зачем этот документ

Это не финальный `schema.prisma`, а рабочий черновик будущей модели.

Его задача:

- показать, какие модели нужны;
- какие поля обязаны сохраниться;
- какие связи и индексы нельзя потерять;
- где будут дополнительные auth-модели, которых раньше не было в Supabase.

## 1. Общий подход

На первом шаге Prisma-схема должна повторять текущую бизнес-схему почти 1 в 1.

Что сохраняем обязательно:

- `UUID` в primary keys
- timestamps
- существующие nullable/non-nullable поля
- `user_id` / `owner_user_id`
- service-scoped discount модель
- client portal links
- reminder tables

Что можно улучшать позже:

- naming cleanup
- enum extraction
- refactor полей
- дополнительные projections

## 2. Базовые auth-модели

### `User`

Рекомендуемые поля:

- `id String @id @db.Uuid`
- `email String @unique`
- `passwordHash String`
- `role UserRole`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### `RefreshToken`

Рекомендуемые поля:

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `tokenHash String`
- `expiresAt DateTime`
- `revokedAt DateTime?`
- `createdAt DateTime @default(now())`

## 3. Бизнес-модели

### `Client`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `name String`
- `phone String`
- `createdAt DateTime @default(now())`

Индексы:

- `@@index([userId])`
- `@@index([userId, phone])`

### `Category`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `categoryName String`
- `createdAt DateTime @default(now())`

### `Service`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `categoryId String? @db.Uuid`
- `name String`
- `price Decimal?`
- `createdAt DateTime @default(now())`

### `Appointment`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `clientName String`
- `clientPhone String`
- `categoryName String`
- `serviceName String`
- `serviceId String? @db.Uuid`
- `appointmentAt DateTime?`
- `appointmentEnd DateTime?`
- `status AppointmentStatus`
- `amount Decimal?`
- `serviceAmount Decimal?`
- `extraAmount Decimal?`
- `discountAmount Decimal?`
- `appliedDiscountId String? @db.Uuid`
- `notes String?`
- `createdAt DateTime @default(now())`

Статусы:

- `booked`
- `completed`
- `cancelled`
- `no_show`

### `DiscountRule`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `discountPercent Int`
- `isActive Boolean`
- `createdAt DateTime @default(now())`

### `ClientDiscount`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `clientPhone String`
- `appointmentId String? @db.Uuid`
- `feedbackToken String?`
- `discountPercent Int`
- `sourceType DiscountSourceType`
- `serviceId String? @db.Uuid`
- `serviceNameSnapshot String?`
- `note String?`
- `expiresAt DateTime?`
- `isUsed Boolean @default(false)`
- `usedAt DateTime?`
- `usedOnAppointmentId String? @db.Uuid`
- `reservedAt DateTime?`
- `reservedForAppointmentId String? @db.Uuid`
- `createdAt DateTime @default(now())`

Источник:

- `manual`
- `feedback`
- `campaign`

### `FeedbackToken`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `appointmentId String? @db.Uuid`
- `token String`
- `expiresAt DateTime`
- `isActive Boolean @default(true)`
- `usedAt DateTime?`
- `createdAt DateTime @default(now())`

### `FeedbackResponse`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `feedbackText String`
- `scoreResult Int?`
- `scoreExplanation Int?`
- `scoreComfort Int?`
- `scoreBooking Int?`
- `scoreRecommendation Int?`
- `periodBucket String`
- `createdAt DateTime @default(now())`

### `RecommendationPrompt`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `name String`
- `content String`
- `isDefault Boolean`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### `RecommendationJob`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `promptId String? @db.Uuid`
- `resultId String? @db.Uuid`
- `periodType String`
- `periodFrom DateTime`
- `periodTo DateTime`
- `status RecommendationJobStatus`
- `requestedAt DateTime @default(now())`
- `startedAt DateTime?`
- `finishedAt DateTime?`
- `durationMs Int?`
- `promptChars Int?`
- `sourceCount Int?`
- `modelName String?`
- `inputTokens Int?`
- `outputTokens Int?`
- `errorCode String?`
- `errorMessage String?`

### `AiRecommendation`

- `id String @id @db.Uuid`
- `userId String @db.Uuid`
- `periodType String`
- `periodFrom DateTime`
- `periodTo DateTime`
- `promptId String? @db.Uuid`
- `promptIdSnapshot String?`
- `promptNameSnapshot String?`
- `promptSnapshot String?`
- `summary String`
- `sourceCount Int`
- `modelName String?`
- `inputTokens Int?`
- `outputTokens Int?`
- `createdAt DateTime @default(now())`

### `ClientPortalInvite`

- `id String @id @db.Uuid`
- `ownerUserId String @db.Uuid`
- `createdBy String @db.Uuid`
- `clientPhone String`
- `tokenHash String`
- `purpose ClientPortalInvitePurpose`
- `expiresAt DateTime`
- `usedAt DateTime?`
- `createdAt DateTime @default(now())`

### `ClientPortalProfile`

- `authUserId String @id @db.Uuid`
- `phone String`
- `displayName String?`
- `notificationsEnabled Boolean @default(false)`
- `lastLoginAt DateTime?`
- `createdAt DateTime @default(now())`

### `ClientPortalLink`

- `id String @id @db.Uuid`
- `ownerUserId String @db.Uuid`
- `clientAuthUserId String @db.Uuid`
- `clientId String? @db.Uuid`
- `clientPhone String`
- `isActive Boolean @default(true)`
- `lastSeenAt DateTime?`
- `createdAt DateTime @default(now())`

Критичный уникальный ключ:

- `@@unique([ownerUserId, clientPhone])`

### `PushSubscription`

- `id String @id @db.Uuid`
- `ownerUserId String @db.Uuid`
- `authUserId String @db.Uuid`
- `audience String`
- `endpoint String`
- `p256dh String`
- `auth String`
- `createdAt DateTime @default(now())`

### `OwnerNotificationSettings`

- `userId String @id @db.Uuid`
- `reminderOffsetsMinutes Int[]`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

### `AppointmentReminder`

- `id String @id @db.Uuid`
- `appointmentId String @db.Uuid`
- `userId String @db.Uuid`
- `offsetMinutes Int`
- `remindAt DateTime`
- `status ReminderStatus`
- `sentAt DateTime?`
- `cancelledAt DateTime?`
- `createdAt DateTime @default(now())`

## 4. Рекомендуемые enum

- `UserRole`: `owner | client_portal`
- `AppointmentStatus`: `booked | completed | cancelled | no_show`
- `DiscountSourceType`: `manual | feedback | campaign`
- `RecommendationJobStatus`: `queued | running | succeeded | failed`
- `ReminderStatus`: `pending | sent | cancelled`
- `ClientPortalInvitePurpose`: `activation | password_reset`

## 5. Какие ограничения обязательно повторить

Нужно сохранить:

- `feedback token` uniqueness
- `appointment reminder` uniqueness
- `client portal link` uniqueness на `owner + clientPhone`
- rating range checks `1..5`
- обязательность owner scope почти во всех доменных таблицах

## 6. Как использовать Prisma на старте

Лучший путь:

1. Сначала сделать ручной черновик `schema.prisma`.
2. Потом сравнить его с реальной staging БД.
3. Использовать `prisma db pull` как инструмент сверки, а не как единственный источник истины.

## 7. Что не надо оптимизировать сейчас

Пока рано:

- выносить read models
- делать CQRS projections
- разносить owner/client tables по разным схемам
- изобретать event sourcing

Сначала цель:

- без потерь повторить текущую рабочую модель.
