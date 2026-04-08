-- Apply manually after first Prisma migration on staging DB.
-- This file targets current Prisma table/column names (PascalCase/camelCase).

-- 1) Prevent appointment overlap by owner using range GiST index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS appointments_user_no_overlap
  ON "Appointment"
  USING gist ("userId" gist_uuid_ops, tstzrange("appointmentAt", "appointmentEnd", '[)'));

-- 2) Ensure only one active discount rule per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_rules_one_active_per_user
  ON "DiscountRule" ("userId")
  WHERE "isActive" = true;

-- 3) Ensure feedback token is unique when present.
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_discounts_feedback_token_unique
  ON "ClientDiscount" ("feedbackToken")
  WHERE "feedbackToken" IS NOT NULL;
