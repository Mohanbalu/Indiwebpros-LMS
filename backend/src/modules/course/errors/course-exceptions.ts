import { AppError } from "@/errors/custom-errors";

export class CourseNotFoundException extends AppError {
  constructor(message = "Course not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CategoryNotFoundException extends AppError {
  constructor(message = "Category not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ModuleNotFoundException extends AppError {
  constructor(message = "Module not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LessonNotFoundException extends AppError {
  constructor(message = "Lesson not found") {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CoursePermissionException extends AppError {
  constructor(message = "You do not have permission to manage this course") {
    super(message, 403);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CourseValidationException extends AppError {
  constructor(message = "Invalid course data", errors: unknown[] = []) {
    super(message, 400, errors);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateSlugException extends AppError {
  constructor(slug: string) {
    super(`Slug "${slug}" already exists`, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
