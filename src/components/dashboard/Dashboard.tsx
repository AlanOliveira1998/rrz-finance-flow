
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ClientList } from '@/components/clients/ClientList';
import { ClientForm } from '@/components/clients/ClientForm';
import { Reports } from '@/components/reports/Reports';
import { UserManagement } from '@/components/admin/UserManagement';
import { Invoice } from '@/hooks/useInvoices';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaxesList } from '@/components/taxes/TaxesList';
import { Client } from '@/hooks/useClients';
import { Project } from '@/hooks/useProjects';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';

const LogsPanel = () => {
  const [logs, setLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem('rrz_logs') || '[]').reverse());
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Histórico de Alterações</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Data/Hora</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Usuário</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Tipo</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Ação</th>
              <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Detalhes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">Nenhuma alteração registrada.</td></tr>
            )}
            {logs.map((log, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.user}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.type}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.action}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {log.type === 'cliente' && log.razaoSocial && `Cliente: ${log.razaoSocial}`}
                  {log.type === 'nota' && log.numero && `Nota: ${log.numero}`}
                  {log.type === 'projeto' && log.nome && `Projeto: ${log.nome}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map URL path to tab
  const path = location.pathname.replace(/^\/dashboard\/?/, '') || 'dashboard';

  // Função para navegar ao trocar de aba
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate('/dashboard'); break;
      case 'clients':
        navigate('/dashboard/clients'); break;
      case 'new-client':
        navigate('/dashboard/new-client'); break;
      case 'projects':
        navigate('/dashboard/projects'); break;
      case 'new-project':
        navigate('/dashboard/new-project'); break;
      case 'invoices':
        navigate('/dashboard/invoices'); break;
      case 'new-invoice':
        navigate('/dashboard/new-invoice'); break;
      case 'reports':
        navigate('/dashboard/reports'); break;
      case 'users':
        navigate('/dashboard/users'); break;
      case 'taxes':
        navigate('/dashboard/taxes'); break;
      case 'logs':
        navigate('/dashboard/logs'); break;
      default:
        navigate('/dashboard');
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    navigate('/dashboard/new-invoice');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    navigate('/dashboard/new-client');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    // setActiveTab('clients'); // Removed
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    // setActiveTab('new-project'); // Removed
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    // setActiveTab('projects'); // Removed
  };

  const renderContent = () => {
    // Removed switch statement based on activeTab
    return (
      <Routes>
        <Route path="" element={<DashboardOverview />} />
        <Route path="clients" element={<ClientList onEdit={handleEditClient} />} />
        <Route path="new-client" element={<ClientForm client={selectedClient} onBack={handleBackToClients} />} />
        <Route path="projects" element={<ProjectList onEdit={handleEditProject} />} />
        <Route path="new-project" element={<ProjectForm project={selectedProject} onBack={handleBackToProjects} />} />
        <Route path="invoices" element={<InvoiceList onEdit={handleEditInvoice} />} />
        <Route path="new-invoice" element={<InvoiceForm invoice={selectedInvoice} onBack={() => navigate('/dashboard/invoices')} />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="taxes" element={<TaxesList />} />
        <Route path="logs" element={<LogsPanel />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={path} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
