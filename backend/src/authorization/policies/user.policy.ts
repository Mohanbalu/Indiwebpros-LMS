import { Permission } from "../constants/permissions";
import { AuthorizationService } from "../services/authorization.service";

export class UserPolicy {
  private static auth = new AuthorizationService();

  static canRead(userId: string, userRole: string, targetUserId: string): boolean {
    if (userRole === "Admin") return true;
    return userId === targetUserId;
  }

  static canCreate(_userId: string, userRole: string): boolean {
    return this.auth.hasPermission(userRole, Permission.USER_CREATE);
  }

  static canUpdate(userId: string, userRole: string, targetUserId: string): boolean {
    if (userRole === "Admin") return true;
    return userId === targetUserId;
  }

  static canDelete(userId: string, userRole: string, targetUserId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.USER_DELETE, targetUserId);
  }
}
