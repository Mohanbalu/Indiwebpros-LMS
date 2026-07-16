import { Permission } from "../constants/permissions";

export interface IAuthorizationService {
  hasRole(userRole: string, requiredRole: string): boolean;
  hasPermission(userRole: string, permission: Permission): boolean;
  checkOwnership(userId: string, resourceOwnerId: string): boolean;
  canAccess(userId: string, userRole: string, permission: Permission, resourceOwnerId?: string): boolean;
  canManage(userId: string, userRole: string, permission: Permission, resourceOwnerId?: string): boolean;
}
