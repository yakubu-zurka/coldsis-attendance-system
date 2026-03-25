export type AuditAction = 
  | 'STAFF_ADDED' 
  | 'STAFF_UPDATED' 
  | 'STAFF_DELETED' 
  | 'ATTENDANCE_DELETED' 
  | 'SESSION_AUTOCLOSED' 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED';

export function useAuditLogger() {
  const logActivity = async (action: AuditAction, details: string, adminEmail: string = 'System') => {
    // Only log to console to save Firebase database space
    console.log(`[AUDIT: ${action}] by ${adminEmail} - ${details}`);
  };

  return { logActivity };
}
