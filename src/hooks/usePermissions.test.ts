import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock do useAuth para controlar o role do usuário
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('role: admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { role: 'admin' } });
    });

    it('pode criar', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate).toBe(true);
    });

    it('pode editar', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEdit).toBe(true);
    });

    it('pode deletar', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDelete).toBe(true);
    });

    it('pode gerenciar usuários', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canManageUsers).toBe(true);
    });
  });

  describe('role: financeiro', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { role: 'financeiro' } });
    });

    it('pode criar e editar', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate).toBe(true);
      expect(result.current.canEdit).toBe(true);
    });

    it('não pode gerenciar usuários', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canManageUsers).toBe(false);
    });
  });

  describe('role: visualizador', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { role: 'visualizador' } });
    });

    it('não pode criar, editar ou deletar', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.canDelete).toBe(false);
    });

    it('pode ver relatórios', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewReports).toBe(true);
    });
  });

  describe('usuário sem role definido', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
    });

    it('aplica permissões de visualizador por padrão', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreate).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
    });
  });
});
