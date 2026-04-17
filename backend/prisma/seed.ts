import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedOptionalDefaultOwner() {
  const email = (
    process.env.SEED_OWNER_EMAIL ?? "owner@test.local"
  ).trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? "password12";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed: пользователь уже есть (${email}), пропуск дефолтного owner.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "owner",
      isActive: true,
      authType: "password",
    },
  });

  console.log(
    `Seed: создан owner ${email} (пароль из SEED_OWNER_PASSWORD или дефолт).`,
  );
}

/** Тестовый owner для локальной проверки (парольный вход при флаге на Nest). */
async function ensureFixedTestOwner() {
  const email = "muminaexpert@yandex.com";
  const password = "123456789";
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "owner") {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          authType: "password",
          isActive: true,
        },
      });
      console.log(`Seed: обновлён тестовый owner ${email} (пароль ${password}).`);
      return;
    }

    /** Только dev-seed: почта нужна как owner, снимаем клиентский кабинет с этого User. */
    console.warn(
      `Seed: ${email} был ${existing.role} — удаляю client-portal привязки и ставлю owner.`,
    );
    await prisma.$transaction(async (tx) => {
      await tx.pushSubscription.deleteMany({ where: { authUserId: existing.id } });
      await tx.clientPortalLink.deleteMany({
        where: { clientAuthUserId: existing.id },
      });
      await tx.clientPortalProfile.deleteMany({
        where: { authUserId: existing.id },
      });
      await tx.refreshToken.deleteMany({ where: { userId: existing.id } });
      await tx.oAuthIdentity.deleteMany({ where: { userId: existing.id } });
      await tx.ownerSubscription.deleteMany({ where: { ownerUserId: existing.id } });
      await tx.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          authType: "password",
          role: "owner",
          isActive: true,
        },
      });
    });
    console.log(`Seed: ${email} переведён в owner (пароль ${password}).`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "owner",
      isActive: true,
      authType: "password",
    },
  });

  console.log(`Seed: создан тестовый owner ${email} (пароль ${password}).`);
}

async function main() {
  await seedOptionalDefaultOwner();
  await ensureFixedTestOwner();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
