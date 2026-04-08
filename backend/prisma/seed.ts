import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.SEED_OWNER_EMAIL ?? "owner@test.local"
  ).trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? "password12";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed: пользователь уже есть (${email}), пропуск.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "owner",
      isActive: true,
    },
  });

  console.log(
    `Seed: создан owner ${email} (пароль из SEED_OWNER_PASSWORD или дефолт).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
