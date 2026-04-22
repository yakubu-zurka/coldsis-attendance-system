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
    // Log activity to console
    console.log(`[AUDIT: ${action}] by ${adminEmail} - ${details}`);
  };

  return { logActivity };
}
