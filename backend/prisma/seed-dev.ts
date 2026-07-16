import { PrismaClient } from "../src/generated/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development database for E2E tests...");

  // Upsert Student and Admin roles
  const studentRole = await prisma.role.upsert({
    where: { name: "Student" },
    update: {},
    create: { name: "Student", description: "General learner enrolled in courses" },
  });

  const instructorRole = await prisma.role.upsert({
    where: { name: "Instructor" },
    update: {},
    create: { name: "Instructor", description: "Course creator who uploads courses and resources" },
  });

  console.log("UPSERTED ROLES");

  // Hash password
  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // Create student user if not exists
  const studentUser = await prisma.user.upsert({
    where: { email: "student@indiwebpros.in" },
    update: { password: hashedPassword, isEmailVerified: true },
    create: {
      email: "student@indiwebpros.in",
      password: hashedPassword,
      firstName: "Alex",
      lastName: "Student",
      roleId: studentRole.id,
      isEmailVerified: true,
    },
  });

  console.log(`UPSERTED STUDENT: ${studentUser.email}`);

  // Create instructor user if not exists
  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@indiwebpros.in" },
    update: { password: hashedPassword, isEmailVerified: true },
    create: {
      email: "instructor@indiwebpros.in",
      password: hashedPassword,
      firstName: "Bob",
      lastName: "Instructor",
      roleId: instructorRole.id,
      isEmailVerified: true,
    },
  });

  console.log(`UPSERTED INSTRUCTOR: ${instructorUser.email}`);

  // Create a default category
  const category = await prisma.category.upsert({
    where: { slug: "full-stack" },
    update: {},
    create: {
      name: "Full Stack",
      slug: "full-stack",
      description: "End to end web application development courses",
      icon: "code",
    },
  });

  console.log("UPSERTED CATEGORY");

  // Create a default published course for E2E (matches frontend catalog fallback)
  const course = await prisma.course.upsert({
    where: { slug: "full-stack-typescript-saas-architecture" },
    update: {
      status: "PUBLISHED",
      price: 199.00,
    },
    create: {
      title: "Advanced Full Stack TypeScript SaaS Architecture",
      slug: "full-stack-typescript-saas-architecture",
      description: "Build, secure, and deploy complete Next.js apps with Postgres, Prisma ORM, BullMQ queues, and Docker.",
      status: "PUBLISHED",
      price: 199.00,
      categoryId: category.id,
      instructorId: instructorUser.id,
      createdById: instructorUser.id,
    },
  });

  console.log(`UPSERTED COURSE: ${course.title}`);

  // Create a Course Module
  const courseModule = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: "Introduction to Enterprise Prisma & PostgreSQL setups",
      description: "Configure dynamic database pooling properties, schema constraints, and database seeds inside the monorepo deployment matrix.",
      sortOrder: 1,
    },
  });

  console.log(`CREATED MODULE: ${courseModule.title}`);

  // Create two Video Lessons for testing
  const lesson1 = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Lesson 1: Introduction to database connection pool",
      slug: "intro-db-pool",
      durationSeconds: 15 * 60,
      lessonType: "VIDEO",
      status: "PUBLISHED",
      sortOrder: 1,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: "Lesson 2: Setting up foreign key constraints and index models",
      slug: "fk-constraints",
      durationSeconds: 25 * 60,
      lessonType: "VIDEO",
      status: "PUBLISHED",
      sortOrder: 2,
    },
  });

  console.log(`CREATED LESSONS: ${lesson1.title}, ${lesson2.title}`);
}

main()
  .catch((e) => {
    console.error("❌ Dev seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
