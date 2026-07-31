import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@productstudio/auth";
import { generateId } from "@productstudio/shared-types";

const prisma = new PrismaClient();

async function main() {
  const email = "designer@productstudio.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed user already exists:", email);
    return;
  }

  const passwordHash = await hashPassword("password123");
  const user = await prisma.user.create({
    data: {
      id: generateId("usr"),
      email,
      passwordHash,
      role: "DESIGNER",
    },
  });

  console.log("Created seed user:", user.email, "password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
