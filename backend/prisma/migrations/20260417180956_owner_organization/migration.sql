-- CreateTable
CREATE TABLE "OwnerOrganization" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "inn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerOrganization_ownerUserId_key" ON "OwnerOrganization"("ownerUserId");

-- CreateIndex
CREATE INDEX "OwnerOrganization_ownerUserId_idx" ON "OwnerOrganization"("ownerUserId");

-- AddForeignKey
ALTER TABLE "OwnerOrganization" ADD CONSTRAINT "OwnerOrganization_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
