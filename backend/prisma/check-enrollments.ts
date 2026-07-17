import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findUnique({
    where: { email: "student@indiwebpros.in" },
    include: {
      enrollments: {
        include: {
          course: true,
        }
      }
    }
  });
  console.log("Student User ID:", student?.id);
  console.log("Enrollments:", JSON.stringify(student?.enrollments, null, 2));
}

main().finally(() => prisma.$disconnect());
