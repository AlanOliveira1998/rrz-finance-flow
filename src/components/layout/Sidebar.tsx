
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'invoices', label: 'Notas Fiscais', icon: '📄' },
    { id: 'new-invoice', label: 'Nova Nota', icon: '➕' },
    { id: 'clients', label: 'Clientes', icon: '🏢' },
    { id: 'new-client', label: 'Novo Cliente', icon: '👤' },
    { id: 'projects', label: 'Projetos', icon: '🗂️' },
    { id: 'new-project', label: 'Novo Projeto', icon: '📝' },
    { id: 'taxes', label: 'Impostos', icon: '💸' },
    { id: 'reports', label: 'Relatórios', icon: '📈' },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Usuários', icon: '👥' }] : [])
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg">RRZ</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Sistema Financeiro</h2>
            <p className="text-sm text-gray-400">RRZ Consultoria</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start text-left ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
};
