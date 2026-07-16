import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding data...");

  // Default Roles
  const roles = [
    { name: "Admin", description: "System administrator with full permissions" },
    { name: "Instructor", description: "Course creator who uploads courses and resources" },
    { name: "Mentor", description: "Student helper providing guidance and QA" },
    { name: "Student", description: "General learner enrolled in courses" },
  ];

  console.log("Seeding Roles...");
  for (const role of roles) {
    const upsertedRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    console.log(`- Role: ${upsertedRole.name}`);
  }

  // Default Categories
  const categories = [
    {
      name: "Full Stack",
      slug: "full-stack",
      description: "End to end web application development courses",
      icon: "code",
    },
    {
      name: "React",
      slug: "react",
      description: "Frontend web interfaces using React ecosystem",
      icon: "atom",
    },
    {
      name: "Python",
      slug: "python",
      description: "Scripting, web apps, and utility tooling in Python",
      icon: "terminal",
    },
    {
      name: "Java",
      slug: "java",
      description: "Enterprise backends and OOP system principles",
      icon: "coffee",
    },
    {
      name: "Artificial Intelligence",
      slug: "artificial-intelligence",
      description: "Neural networks and advanced AI systems",
      icon: "brain",
    },
    {
      name: "Machine Learning",
      slug: "machine-learning",
      description: "Predictive analytics and data model training",
      icon: "cpu",
    },
    {
      name: "AWS",
      slug: "aws",
      description: "Cloud computing and hosting services on AWS",
      icon: "cloud",
    },
    {
      name: "Azure",
      slug: "azure",
      description: "Cloud architectures and compute systems on Microsoft Azure",
      icon: "server",
    },
    {
      name: "Cyber Security",
      slug: "cyber-security",
      description: "Network security, vulnerability parsing and defensive setups",
      icon: "shield",
    },
    {
      name: "Data Science",
      slug: "data-science",
      description: "Data analytics, modeling and visualizations",
      icon: "bar-chart",
    },
  ];

  console.log("Seeding Categories...");
  for (const category of categories) {
    const upsertedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      },
    });
    console.log(`- Category: ${upsertedCategory.name}`);
  }

  console.log("🌱 Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
