-- CreateEnum
CREATE TYPE "ReminderRecipient" AS ENUM ('owner', 'client');

-- AlterTable
ALTER TABLE "AppointmentReminder" ADD COLUMN "recipient" "ReminderRecipient" NOT NULL DEFAULT 'owner';

DROP INDEX IF EXISTS "AppointmentReminder_appointmentId_offsetMinutes_key";

CREATE UNIQUE INDEX "AppointmentReminder_appointmentId_offsetMinutes_recipient_key" ON "AppointmentReminder"("appointmentId", "offsetMinutes", "recipient");

ALTER TABLE "ClientPortalProfile" ADD COLUMN "clientReminderOffsetsMinutes" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "ClientPortalProfile" ADD COLUMN "quietHoursStartUtc" VARCHAR(5);
ALTER TABLE "ClientPortalProfile" ADD COLUMN "quietHoursEndUtc" VARCHAR(5);
