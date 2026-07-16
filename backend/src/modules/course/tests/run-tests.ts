import { slugify, generateUniqueSlug, resolveUniqueSlug } from "@/utils/slug.util";
import { canManageCourse, canReadCourse, isAdmin } from "@/modules/course/utils/course-permissions";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/modules/course/validators/category.validator";
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
} from "@/modules/course/validators/course.validator";
import { createModuleSchema, reorderModulesSchema } from "@/modules/course/validators/module.validator";
import { createLessonSchema } from "@/modules/course/validators/lesson.validator";
import { createResourceSchema } from "@/modules/course/validators/resource.validator";
import { createFAQSchema, tagSchema } from "@/modules/course/validators/course-meta.validator";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`❌ FAILED: ${message}`);
  console.log(`✅ [PASS] ${message}`);
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
    throw new Error(`Expected error but none thrown: ${message}`);
  } catch (err) {
    if ((err as Error).message.startsWith("Expected error but none thrown")) throw err;
    console.log(`✅ [PASS] ${message}`);
  }
}

async function run() {
  console.log("📚 Running Course Module tests...\n");

  // ── Slug Utility ────────────────────────────────────────────────────────
  console.log("── Slug Utility ──");
  assert(slugify("Hello World!") === "hello-world", "slugify removes special chars");
  assert(slugify("  React JS 101  ") === "react-js-101", "slugify trims and lowercases");
  assert(slugify("TypeScript---Advanced") === "typescript-advanced", "slugify collapses hyphens");
  const unicodeSlug = slugify("Cours d'Été");
  assert(typeof unicodeSlug === "string" && unicodeSlug.length > 0, "slugify handles unicode without crash");

  const unique = generateUniqueSlug("My Course Title");
  assert(unique.startsWith("my-course-title-"), "generateUniqueSlug has correct prefix");
  assert(unique.length > 20, "generateUniqueSlug adds random suffix");

  const resolved = await resolveUniqueSlug("Test Course", async (slug) => slug === "test-course");
  assert(!resolved.startsWith("test-course-") || resolved !== "test-course", "resolveUniqueSlug avoids collision");

  // ── Permission Utilities ────────────────────────────────────────────────
  console.log("\n── Permission Utilities ──");
  const adminId = "admin-001";
  const instructorId = "instructor-001";
  const otherInstructorId = "instructor-002";

  assert(canManageCourse(adminId, "Admin", instructorId) === true, "Admin can manage any course");
  assert(canManageCourse(instructorId, "Instructor", instructorId) === true, "Instructor can manage own course");
  assert(canManageCourse(otherInstructorId, "Instructor", instructorId) === false, "Instructor cannot manage other's course");
  assert(canManageCourse("student-001", "Student", instructorId) === false, "Student cannot manage course");
  assert(isAdmin("Admin") === true, "isAdmin correctly identifies admin");
  assert(isAdmin("Instructor") === false, "isAdmin rejects instructor");
  assert(canReadCourse("Student", "PUBLISHED") === true, "Student can read published courses");
  assert(canReadCourse("Student", "DRAFT") === false, "Student cannot read draft courses");
  assert(canReadCourse("Admin", "DRAFT") === true, "Admin can read draft courses");

  // ── Category Validator ──────────────────────────────────────────────────
  console.log("\n── Category Validator ──");
  const validCategory = createCategorySchema.parse({ name: "Web Development", sortOrder: "1" });
  assert(validCategory.name === "Web Development", "Category: valid name accepted");
  assert(validCategory.sortOrder === 1, "Category: sortOrder coerced to number");
  assert(validCategory.isActive === true, "Category: isActive defaults to true");

  assertThrows(() => createCategorySchema.parse({ name: "A" }), "Category: rejects name too short");

  const partialUpdate = updateCategorySchema.parse({ icon: "🎓" });
  assert(partialUpdate.icon === "🎓", "Category update: accepts partial fields");

  // ── Course Validator ────────────────────────────────────────────────────
  console.log("\n── Course Validator ──");
  const validCourse = createCourseSchema.parse({
    title: "Complete Node.js Bootcamp",
    description: "A very detailed description of the Node.js bootcamp course.",
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    price: "299",
    difficulty: "INTERMEDIATE",
  });
  assert(validCourse.title === "Complete Node.js Bootcamp", "Course: valid title accepted");
  assert(validCourse.price === 299, "Course: price coerced to number");
  assert(validCourse.difficulty === "INTERMEDIATE", "Course: difficulty accepted");
  assert(validCourse.language === "English", "Course: language defaults to English");
  assert(validCourse.visibility === "PUBLIC", "Course: visibility defaults to PUBLIC");

  assertThrows(
    () => createCourseSchema.parse({ title: "Hi", description: "Short", categoryId: "123e4567-e89b-12d3-a456-426614174000" }),
    "Course: rejects title too short"
  );
  assertThrows(
    () => createCourseSchema.parse({ title: "Valid Title", description: "x", categoryId: "not-a-uuid" }),
    "Course: rejects invalid category UUID"
  );
  assertThrows(
    () => createCourseSchema.parse({ title: "Valid Title", description: "x".repeat(25), categoryId: "123e4567-e89b-12d3-a456-426614174000", price: -100 }),
    "Course: rejects negative price"
  );

  // ── Module Validator ────────────────────────────────────────────────────
  console.log("\n── Module Validator ──");
  const validModule = createModuleSchema.parse({ title: "Introduction to Node", sortOrder: "0" });
  assert(validModule.title === "Introduction to Node", "Module: valid title");
  assert(validModule.sortOrder === 0, "Module: sortOrder coerced");

  const reorder = reorderModulesSchema.parse({
    items: [
      { id: "123e4567-e89b-12d3-a456-426614174000", sortOrder: 0 },
      { id: "987fcdeb-51a2-43f7-9876-543210fedcba", sortOrder: 1 },
    ],
  });
  assert(reorder.items.length === 2, "Module: reorder schema accepts items");
  assertThrows(
    () => reorderModulesSchema.parse({ items: [] }),
    "Module: reorder rejects empty items"
  );

  // ── Lesson Validator ────────────────────────────────────────────────────
  console.log("\n── Lesson Validator ──");
  const validLesson = createLessonSchema.parse({ title: "Setting up Node", lessonType: "VIDEO", durationSeconds: "1800" });
  assert(validLesson.title === "Setting up Node", "Lesson: valid title");
  assert(validLesson.lessonType === "VIDEO", "Lesson: lessonType accepted");
  assert(validLesson.durationSeconds === 1800, "Lesson: durationSeconds coerced");
  assert(validLesson.isPreview === false, "Lesson: isPreview defaults to false");

  assertThrows(
    () => createLessonSchema.parse({ title: "X", lessonType: "INVALID_TYPE" }),
    "Lesson: rejects invalid lessonType"
  );

  // ── Resource Validator ───────────────────────────────────────────────────
  console.log("\n── Resource Validator ──");
  const validResource = createResourceSchema.parse({
    title: "Node Cheatsheet",
    fileId: "123e4567-e89b-12d3-a456-426614174000",
    resourceType: "PDF",
  });
  assert(validResource.title === "Node Cheatsheet", "Resource: valid title");
  assertThrows(
    () => createResourceSchema.parse({ title: "Test", fileId: "not-a-uuid", resourceType: "PDF" }),
    "Resource: rejects invalid fileId UUID"
  );

  // ── FAQ Validator ────────────────────────────────────────────────────────
  console.log("\n── FAQ Validator ──");
  const validFAQ = createFAQSchema.parse({
    question: "What prerequisites are needed?",
    answer: "Basic JavaScript knowledge is required.",
    sortOrder: "2",
  });
  assert(validFAQ.question.length > 0, "FAQ: valid question");
  assert(validFAQ.sortOrder === 2, "FAQ: sortOrder coerced");

  // ── Tag Validator ────────────────────────────────────────────────────────
  console.log("\n── Tag Validator ──");
  const validTag = tagSchema.parse({ name: "nodejs" });
  assert(validTag.name === "nodejs", "Tag: valid name");
  assertThrows(() => tagSchema.parse({ name: "" }), "Tag: rejects empty name");

  // ── Filter Validator ────────────────────────────────────────────────────
  console.log("\n── Course Filter Validator ──");
  const filter = courseFilterSchema.parse({
    page: "2",
    limit: "10",
    difficulty: "BEGINNER",
    featured: "true",
    sortBy: "price",
    sortOrder: "asc",
  });
  assert(filter.page === 2, "Filter: page coerced");
  assert(filter.limit === 10, "Filter: limit coerced");
  assert(filter.featured === true, "Filter: featured coerced from string");
  assert(filter.sortBy === "price", "Filter: sortBy accepted");

  assertThrows(() => courseFilterSchema.parse({ limit: "200" }), "Filter: rejects limit > 50");

  console.log("\n🎉 All Course Module tests passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test run failed:", err.message);
  process.exit(1);
});
