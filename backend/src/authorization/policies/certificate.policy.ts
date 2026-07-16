import { Permission } from "../constants/permissions";
import { AuthorizationService } from "../services/authorization.service";

export class CertificatePolicy {
  private static auth = new AuthorizationService();

  static canRead(userId: string, userRole: string, studentId: string): boolean {
    if (userRole === "Admin") return true;
    return userId === studentId || this.auth.hasPermission(userRole, Permission.CERTIFICATE_VERIFY);
  }

  static canCreate(userId: string, userRole: string, studentId: string): boolean {
    return this.auth.canManage(userId, userRole, Permission.CERTIFICATE_GENERATE, studentId);
  }

  static canUpdate(_userId: string, userRole: string): boolean {
    return this.auth.hasPermission(userRole, Permission.SYSTEM_ADMIN);
  }

  static canDelete(_userId: string, userRole: string): boolean {
    return this.auth.hasPermission(userRole, Permission.SYSTEM_ADMIN);
  }
}
