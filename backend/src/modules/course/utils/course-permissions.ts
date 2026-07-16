/**
 * Shared ownership/permission utility for the Course module.
 * Admin bypasses all ownership checks; Instructors only manage their own courses.
 */

export function canManageCourse(
  userId: string,
  role: string,
  courseInstructorId: string
): boolean {
  if (role === "Admin") return true;
  if (role === "Instructor" && courseInstructorId === userId) return true;
  return false;
}

export function isAdmin(role: string): boolean {
  return role === "Admin";
}

export function isInstructor(role: string): boolean {
  return role === "Instructor";
}

export function canReadCourse(role: string, status: string): boolean {
  // Students and Mentors can only read PUBLISHED courses
  if (role === "Student" || role === "Mentor") {
    return status === "PUBLISHED";
  }
  return true;
}
