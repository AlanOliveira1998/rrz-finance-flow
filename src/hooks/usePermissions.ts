import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'financeiro' | 'visualizador';

interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canAccessPayables: boolean;
  role: UserRole;
}

const PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canViewReports: true,
    canAccessPayables: true,
    role: 'admin',
  },
  financeiro: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: false,
    canViewReports: true,
    canAccessPayables: true,
    role: 'financeiro',
  },
  visualizador: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canViewReports: true,
    canAccessPayables: false,
    role: 'visualizador',
  },
};

const DEFAULT_PERMISSIONS = PERMISSIONS.visualizador;

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || 'visualizador';
  return PERMISSIONS[role] ?? DEFAULT_PERMISSIONS;
}
