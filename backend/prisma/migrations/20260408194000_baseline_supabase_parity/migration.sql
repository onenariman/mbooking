-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'client_portal');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('booked', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "DiscountSourceType" AS ENUM ('manual', 'feedback');

-- CreateEnum
CREATE TYPE "RecommendationJobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent', 'cancelled');

-- CreateEnum
CREATE TYPE "ClientPortalInvitePurpose" AS ENUM ('activation', 'password_reset');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceId" UUID,
    "appointmentAt" TIMESTAMP(3),
    "appointmentEnd" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL,
    "amount" DECIMAL(10,2),
    "serviceAmount" DECIMAL(10,2),
    "extraAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "appliedDiscountId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDiscount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "appointmentId" UUID,
    "feedbackToken" TEXT,
    "discountPercent" INTEGER NOT NULL,
    "sourceType" "DiscountSourceType" NOT NULL,
    "serviceId" UUID,
    "serviceNameSnapshot" TEXT,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedOnAppointmentId" UUID,
    "reservedAt" TIMESTAMP(3),
    "reservedForAppointmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "appointmentId" UUID,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "scoreResult" INTEGER,
    "scoreExplanation" INTEGER,
    "scoreComfort" INTEGER,
    "scoreBooking" INTEGER,
    "scoreRecommendation" INTEGER,
    "periodBucket" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationPrompt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "promptId" UUID,
    "resultId" UUID,
    "periodType" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "status" "RecommendationJobStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "promptChars" INTEGER,
    "sourceCount" INTEGER,
    "modelName" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "RecommendationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodFrom" DATE NOT NULL,
    "periodTo" DATE NOT NULL,
    "promptId" UUID,
    "promptIdSnapshot" TEXT,
    "promptNameSnapshot" TEXT,
    "promptSnapshot" TEXT,
    "summary" TEXT NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "modelName" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPortalInvite" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "ClientPortalInvitePurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortalInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPortalProfile" (
    "authUserId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortalProfile_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "ClientPortalLink" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "clientAuthUserId" UUID NOT NULL,
    "clientId" UUID,
    "clientPhone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "authUserId" UUID NOT NULL,
    "audience" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerNotificationSettings" (
    "userId" UUID NOT NULL,
    "reminderOffsetsMinutes" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerNotificationSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AppointmentReminder" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_phone_idx" ON "Client"("userId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Category_categoryName_key" ON "Category"("categoryName");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "Service_userId_idx" ON "Service"("userId");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_user_service_time_unique" ON "Appointment"("userId", "appointmentAt", "serviceName");

-- CreateIndex
CREATE INDEX "DiscountRule_userId_idx" ON "DiscountRule"("userId");

-- CreateIndex
CREATE INDEX "ClientDiscount_userId_idx" ON "ClientDiscount"("userId");

-- CreateIndex
CREATE INDEX "ClientDiscount_clientPhone_idx" ON "ClientDiscount"("clientPhone");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackToken_token_key" ON "FeedbackToken"("token");

-- CreateIndex
CREATE INDEX "FeedbackToken_userId_idx" ON "FeedbackToken"("userId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_userId_idx" ON "FeedbackResponse"("userId");

-- CreateIndex
CREATE INDEX "RecommendationPrompt_userId_idx" ON "RecommendationPrompt"("userId");

-- CreateIndex
CREATE INDEX "RecommendationJob_userId_idx" ON "RecommendationJob"("userId");

-- CreateIndex
CREATE INDEX "AiRecommendation_userId_idx" ON "AiRecommendation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortalInvite_tokenHash_key" ON "ClientPortalInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientPortalInvite_ownerUserId_idx" ON "ClientPortalInvite"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortalProfile_phone_key" ON "ClientPortalProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPortalLink_ownerUserId_clientPhone_key" ON "ClientPortalLink"("ownerUserId", "clientPhone");

-- CreateIndex
CREATE UNIQUE INDEX "idx_client_portal_links_owner_client_auth" ON "ClientPortalLink"("ownerUserId", "clientAuthUserId");

-- CreateIndex
CREATE INDEX "PushSubscription_ownerUserId_idx" ON "PushSubscription"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_auth_user_id_owner_user_id_endpoint_key" ON "PushSubscription"("authUserId", "ownerUserId", "endpoint");

-- CreateIndex
CREATE INDEX "AppointmentReminder_userId_idx" ON "AppointmentReminder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentReminder_appointmentId_offsetMinutes_key" ON "AppointmentReminder"("appointmentId", "offsetMinutes");

