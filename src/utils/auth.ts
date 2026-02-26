import { User, UserRole } from '../types';

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  // Super usuarios tienen todos los permisos por defecto
  if (user.role === UserRole.SUPER_USER) return true;
  
  // Si no tiene permisos definidos, no puede hacer nada extra
  if (!user.permissions) return false;
  
  return user.permissions.includes(permission);
};

export const PERMISSIONS = {
  VIEW_FINANCES: 'view_finances',
  MANAGE_USERS: 'manage_users',
  MANAGE_AREAS: 'manage_areas',
  SEND_WHATSAPP: 'send_whatsapp',
  EDIT_DATABASE: 'edit_database',
  VIEW_INSIGHTS: 'view_insights'
};
