import { Permission } from "../constants/permissions";
import { AuthorizationService } from "../services/authorization.service";

export class LessonPolicy {
  private static auth = new AuthorizationService();

  static canRead(userId: string, userRole: string, courseInstructorId?: string): boolean {
    return this.auth.canAccess(userId, userRole, Permission.COURSE_READ, courseInstructorId);
  }

  static canCreate(_userId: string, userRole: string): boolean {
    return this.auth.hasPermission(userRole, Permission.LESSON_CREATE);
  }

  static canUpdate(userId: string, userRole: string, courseInstructorId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.LESSON_UPDATE, courseInstructorId);
  }

  static canDelete(userId: string, userRole: string, courseInstructorId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.LESSON_DELETE, courseInstructorId);
  }
}
