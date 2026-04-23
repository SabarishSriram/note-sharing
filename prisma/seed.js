// Simple Prisma seed script to create a demo SRM user
// and a few example notes for testing the dashboard.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "demo@srmist.edu.in";
  const password = "password123"; // demo password

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
    },
  });

  await prisma.note.createMany({
    data: [
      {
        title: "Calculus Unit 1",
        subject: "Mathematics",
        semester: 1,
        filePath: "/uploads/demo-calculus-unit-1.pdf",
        userId: user.id,
      },
      {
        title: "Physics Waves PPT",
        subject: "Physics",
        semester: 2,
        filePath: "/uploads/demo-physics-waves.pptx",
        userId: user.id,
      },
      {
        title: "DBMS ER Diagrams",
        subject: "Database Management Systems",
        semester: 3,
        filePath: "/uploads/demo-dbms-er-diagrams.pdf",
        userId: user.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed. You can log in with:");
  console.log("Email: demo@srmist.edu.in");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
