
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const location = window.location;

  // Novo menu para Contas a Pagar
  if (location.search.includes('tab=pagar')) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40 shadow-lg">
        <div className="p-6 border-b border-gray-700 flex-shrink-0 h-32">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/logo2.png" alt="Logo RRZ" className="w-12 h-12 object-contain rounded" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Contas a Pagar</h2>
              <p className="text-sm text-gray-400">RRZ Consultoria</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 scrollbar-thumb-rounded scrollbar-track-rounded">
          <nav>
            <div className="mb-2">
              <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 mt-4 pl-2">Financeiro</div>
              <Button
                key="pagar-lista"
                variant={activeTab === 'pagar-lista' ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${activeTab === 'pagar-lista' ? 'bg-blue-700 text-white' : 'text-gray-200 hover:text-white hover:bg-gray-800'}`}
                onClick={() => onTabChange('pagar-lista')}
                aria-label="Contas a Pagar"
              >
                <span className="mr-3">💸</span>
                Lista de Contas a Pagar
              </Button>
              <Button
                key="pagar-nova"
                variant={activeTab === 'pagar-nova' ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${activeTab === 'pagar-nova' ? 'bg-blue-700 text-white' : 'text-gray-200 hover:text-white hover:bg-gray-800'}`}
                onClick={() => onTabChange('pagar-nova')}
                aria-label="Nova Conta a Pagar"
              >
                <span className="mr-3">➕</span>
                Nova Conta a Pagar
              </Button>
            </div>
          </nav>
        </div>
      </aside>
    );
  }

  const menuSections = [
    {
      title: '',
      items: [
        { id: 'dashboard', label: 'Página Inicial', icon: '📊' },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        { id: 'invoices', label: 'Notas Fiscais', icon: '📄' },
        { id: 'new-invoice', label: 'Nova Nota', icon: '➕' },
        { id: 'taxes', label: 'Impostos', icon: '💸' },
        { id: 'reports', label: 'Relatórios', icon: '📈' },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        { id: 'clients', label: 'Clientes', icon: '🏢' },
        { id: 'new-client', label: 'Novo Cliente', icon: '👤' },
        { id: 'projects', label: 'Projetos', icon: '🗂️' },
        { id: 'new-project', label: 'Novo Projeto', icon: '📝' },
      ],
    },
    {
      title: 'Administração',
      items: [
        ...(user?.role === 'admin' ? [{ id: 'users', label: 'Usuários', icon: '👥' }] : []),
        { id: 'logs', label: 'Histórico de Alterações', icon: '🕑' },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40 shadow-lg">
      <div className="p-6 border-b border-gray-700 flex-shrink-0 h-32">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo2.png" alt="Logo RRZ" className="w-12 h-12 object-contain rounded" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Sistema Financeiro</h2>
            <p className="text-sm text-gray-400">RRZ Consultoria</p>
          </div>
        </div>
      </div>
      
      <Button
        key="dashboard"
        variant={activeTab === 'dashboard' ? "secondary" : "ghost"}
        className={`w-full justify-start text-left mt-4 mb-2 ${
          activeTab === 'dashboard' 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'text-gray-300 hover:text-white hover:bg-gray-800'
        }`}
        onClick={() => onTabChange('dashboard')}
        aria-label="Página Inicial"
      >
        <span className="mr-3">📊</span>
        Página Inicial
      </Button>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 scrollbar-thumb-rounded scrollbar-track-rounded">
        <nav>
          {menuSections.filter(section => section.title !== '').map((section, idx) => (
            <div key={idx} className="mb-2">
              {section.title && <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 mt-4 pl-2">{section.title}</div>}
              {section.items.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    activeTab === item.id 
                      ? 'bg-blue-700 text-white' 
                      : 'text-gray-200 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => onTabChange(item.id)}
                  aria-label={item.label}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
              {idx < menuSections.length - 2 && <hr className="my-4 border-gray-700" />}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
