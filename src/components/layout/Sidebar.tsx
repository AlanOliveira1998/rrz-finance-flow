import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Home, BarChart2, TrendingUp, CreditCard, LayoutGrid, CheckSquare,
  FileText, Receipt, Building2, FolderOpen, DollarSign, BarChart,
  Users, Clock, LogOut, Landmark, ListChecks,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const tab = new URLSearchParams(location.search).get('tab');
  const sub = new URLSearchParams(location.search).get('sub');
  const pathname = location.pathname;

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
      active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  const subCls = (active: boolean) =>
    `flex items-center gap-2 w-full pl-7 pr-3 py-1.5 rounded text-sm transition-colors cursor-pointer ${
      active ? 'text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-200'
    }`;

  const Section = ({ label }: { label: string }) => (
    <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold px-3 pt-5 pb-1">
      {label}
    </div>
  );

  const isPath = (...paths: string[]) => paths.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40 shadow-xl">
      {/* Logo */}
      <div className="p-5 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo2.png" alt="RRZ" className="w-10 h-10 object-contain rounded" />
          <div>
            <p className="font-bold text-sm leading-tight">Sistema Financeiro</p>
            <p className="text-xs text-gray-400">RRZ Consultoria</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <button className={itemCls(pathname === '/dashboard' && !tab)} onClick={() => navigate('/dashboard')}>
          <Home size={16} /> Página Inicial
        </button>
        <button className={itemCls(pathname === '/dashboard/financeiro')} onClick={() => navigate('/dashboard/financeiro')}>
          <BarChart2 size={16} /> Dashboard Financeiro
        </button>

        <Section label="Financeiro" />
        <button className={itemCls(tab === 'receber')} onClick={() => navigate('/dashboard?tab=receber')}>
          <TrendingUp size={16} /> Contas a Receber
        </button>
        <button className={itemCls(tab === 'pagar')} onClick={() => navigate('/dashboard?tab=pagar')}>
          <CreditCard size={16} /> Contas a Pagar
        </button>
        {tab === 'pagar' && (
          <div className="ml-1 border-l border-gray-700 pl-1 space-y-0.5 mt-0.5">
            <button className={subCls(!sub)} onClick={() => navigate('/dashboard?tab=pagar')}>
              Visão Geral
            </button>
            <button className={subCls(sub === 'boletos-cadastro')} onClick={() => navigate('/dashboard?tab=pagar&sub=boletos-cadastro')}>
              Cadastrar Boleto
            </button>
            <button className={subCls(sub === 'fornecedor-lista')} onClick={() => navigate('/dashboard?tab=pagar&sub=fornecedor-lista')}>
              Fornecedores
            </button>
            <button className={subCls(sub === 'fornecedor-cadastro')} onClick={() => navigate('/dashboard?tab=pagar&sub=fornecedor-cadastro')}>
              Cad. Fornecedores
            </button>
          </div>
        )}

        <Section label="Rotinas" />
        <button className={itemCls(isPath('/dashboard/kanban'))} onClick={() => navigate('/dashboard/kanban?tab=rotinas')}>
          <LayoutGrid size={16} /> Kanban de Atividades
        </button>
        <button className={itemCls(isPath('/dashboard/checklist'))} onClick={() => navigate('/dashboard/checklist')}>
          <ListChecks size={16} /> Checklist
        </button>

        <Section label="Cadastros" />
        <button className={itemCls(isPath('/dashboard/proposals', '/dashboard/new-proposal', '/dashboard/edit-proposal'))} onClick={() => navigate('/dashboard/proposals')}>
          <FileText size={16} /> Propostas
        </button>
        <button className={itemCls(isPath('/dashboard/invoices', '/dashboard/new-invoice'))} onClick={() => navigate('/dashboard/invoices')}>
          <Receipt size={16} /> Notas Fiscais
        </button>
        <button className={itemCls(isPath('/dashboard/clients', '/dashboard/new-client'))} onClick={() => navigate('/dashboard/clients')}>
          <Building2 size={16} /> Clientes
        </button>
        <button className={itemCls(isPath('/dashboard/projects', '/dashboard/new-project'))} onClick={() => navigate('/dashboard/projects')}>
          <FolderOpen size={16} /> Projetos
        </button>
        <button className={itemCls(isPath('/dashboard/taxes'))} onClick={() => navigate('/dashboard/taxes')}>
          <DollarSign size={16} /> Impostos
        </button>
        <button className={itemCls(isPath('/dashboard/reports'))} onClick={() => navigate('/dashboard/reports')}>
          <BarChart size={16} /> Relatórios
        </button>

        <Section label="Administração" />
        {permissions.canManageUsers && (
          <button className={itemCls(isPath('/dashboard/users'))} onClick={() => navigate('/dashboard/users')}>
            <Users size={16} /> Usuários
          </button>
        )}
        <button className={itemCls(isPath('/dashboard/logs'))} onClick={() => navigate('/dashboard/logs')}>
          <Clock size={16} /> Histórico
        </button>
      </div>

      {/* User + Logout */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          onClick={async () => { await logout(); navigate('/'); }}
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  );
};
