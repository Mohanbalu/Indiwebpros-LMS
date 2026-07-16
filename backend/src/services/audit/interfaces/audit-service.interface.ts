export interface IAuditService {
  log(payload: Record<string, unknown>): Promise<void>;
  login(userId: string, status: boolean, ip?: string, ua?: string): Promise<void>;
  logout(userId: string, ip?: string, ua?: string): Promise<void>;
  passwordReset(userId: string, action: string, ip?: string, ua?: string): Promise<void>;
  courseAction(userId: string, action: string, courseId: string, ip?: string, ua?: string): Promise<void>;
  adminAction(userId: string, action: string, targetId?: string, ip?: string, ua?: string): Promise<void>;
  securityEvent(eventType: string, action: string, userId?: string, ip?: string, ua?: string, metadata?: Record<string, unknown>): Promise<void>;
}
