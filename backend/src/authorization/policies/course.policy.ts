import { Permission } from "../constants/permissions";
import { AuthorizationService } from "../services/authorization.service";

export class CoursePolicy {
  private static auth = new AuthorizationService();

  static canRead(userId: string, userRole: string, instructorId?: string): boolean {
    return this.auth.canAccess(userId, userRole, Permission.COURSE_READ, instructorId);
  }

  static canCreate(_userId: string, userRole: string): boolean {
    return this.auth.hasPermission(userRole, Permission.COURSE_CREATE);
  }

  static canUpdate(userId: string, userRole: string, instructorId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.COURSE_UPDATE, instructorId);
  }

  static canDelete(userId: string, userRole: string, instructorId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.COURSE_DELETE, instructorId);
  }
}
