import { AuthorizationService } from "../services/authorization.service";
import { Permission } from "../constants/permissions";
import { CoursePolicy } from "../policies/course.policy";
import { UserPolicy } from "../policies/user.policy";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function run() {
  console.log("🌱 Running Authorization and RBAC module tests...");

  const auth = new AuthorizationService();

  // Test 1: Admin should possess all permissions
  assert(auth.hasPermission("Admin", Permission.USER_DELETE), "Admin can delete users");
  assert(auth.hasPermission("Admin", Permission.COURSE_DELETE), "Admin can delete courses");
  assert(auth.hasPermission("Admin", Permission.SYSTEM_ADMIN), "Admin is system admin");

  // Test 2: Student privileges
  assert(auth.hasPermission("Student", Permission.COURSE_READ), "Student can read courses");
  assert(!auth.hasPermission("Student", Permission.COURSE_CREATE), "Student cannot create courses");
  assert(!auth.hasPermission("Student", Permission.USER_DELETE), "Student cannot delete users");

  // Test 3: Instructor privileges
  assert(auth.hasPermission("Instructor", Permission.COURSE_CREATE), "Instructor can create courses");
  assert(auth.hasPermission("Instructor", Permission.LESSON_CREATE), "Instructor can create lessons");
  assert(!auth.hasPermission("Instructor", Permission.SYSTEM_ADMIN), "Instructor is not system admin");

  // Test 4: Ownership checks
  assert(auth.checkOwnership("user-123", "user-123"), "User owns their own resource");
  assert(!auth.checkOwnership("user-123", "user-456"), "User does not own others' resource");

  // Test 5: CoursePolicy evaluation
  assert(CoursePolicy.canRead("user-123", "Student"), "Students can read courses");
  assert(CoursePolicy.canCreate("user-123", "Instructor"), "Instructors can create courses");
  assert(!CoursePolicy.canCreate("user-123", "Student"), "Students cannot create courses");

  // Test 6: CoursePolicy Ownership/Instructor matching rules
  assert(CoursePolicy.canUpdate("instructor-123", "Instructor", "instructor-123"), "Instructor can update own course");
  assert(!CoursePolicy.canUpdate("instructor-123", "Instructor", "instructor-456"), "Instructor cannot update others' course");
  assert(CoursePolicy.canUpdate("admin-123", "Admin", "instructor-456"), "Admin can update others' course (bypass)");

  // Test 7: UserPolicy evaluation
  assert(UserPolicy.canRead("user-123", "Student", "user-123"), "Student can read own profile");
  assert(!UserPolicy.canRead("user-123", "Student", "user-456"), "Student cannot read others' profile");
  assert(UserPolicy.canRead("admin-123", "Admin", "user-456"), "Admin can read others' profile");

  console.log("\n🎉 All 7 authorization and policy test suites passed successfully!");
}

run().catch((error) => {
  console.error("❌ Test suite run failed:", error);
  process.exit(1);
});
