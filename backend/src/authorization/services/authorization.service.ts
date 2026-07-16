import { IAuthorizationService } from "../interfaces/authorization-service.interface";
import { Permission } from "../constants/permissions";
import { RolePermissions } from "../constants/roles";
import { ServiceContainer } from "@/services";

export class AuthorizationService implements IAuthorizationService {
  private static mappingsCache = new Map<string, Set<Permission>>();

  constructor() {
    if (AuthorizationService.mappingsCache.size === 0) {
      for (const [role, permissions] of Object.entries(RolePermissions)) {
        AuthorizationService.mappingsCache.set(role, new Set(permissions));
      }
    }
  }

  hasRole(userRole: string, requiredRole: string): boolean {
    if (userRole === "Admin") return true;
    return userRole.toLowerCase() === requiredRole.toLowerCase();
  }

  hasPermission(userRole: string, permission: Permission): boolean {
    const permissions = AuthorizationService.mappingsCache.get(userRole);
    if (!permissions) return false;
    return permissions.has(Permission.SYSTEM_ADMIN) || permissions.has(permission);
  }

  checkOwnership(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  canAccess(userId: string, userRole: string, permission: Permission, resourceOwnerId?: string): boolean {
    if (this.hasRole(userRole, "Admin")) return true;
    if (!this.hasPermission(userRole, permission)) return false;
    if (resourceOwnerId) {
      return this.checkOwnership(userId, resourceOwnerId);
    }
    return true;
  }

  canManage(userId: string, userRole: string, permission: Permission, resourceOwnerId?: string): boolean {
    return this.canAccess(userId, userRole, permission, resourceOwnerId);
  }

  static async logViolation(
    userId: string | undefined,
    action: string,
    entity: string,
    entityId?: string,
    ipAddress?: string,
    userAgent?: string,
    path?: string,
    method?: string
  ): Promise<void> {
    await ServiceContainer.audit.log({
      userId,
      eventType: "SECURITY",
      action: action.toUpperCase(),
      entity,
      entityId: entityId || null,
      requestMethod: method || "N/A",
      requestPath: path || "N/A",
      statusCode: 403,
      success: false,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: { reason: "Access control violation detected" },
    });
  }
}
