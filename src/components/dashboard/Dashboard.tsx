
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('new-invoice');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('new-client');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setActiveTab('clients');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'invoices':
        return <InvoiceList onEdit={handleEditInvoice} />;
      case 'new-invoice':
        return <InvoiceForm invoice={selectedInvoice} onBack={() => setActiveTab('invoices')} />;
      case 'clients':
        return <ClientList onEdit={handleEditClient} />;
      case 'new-client':
        return <ClientForm client={selectedClient} onBack={handleBackToClients} />;
      case 'projects':
        return <ProjectList />;
      case 'new-project':
        return <ProjectForm />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UserManagement />;
      case 'taxes':
        return <TaxesList />;
      case 'logs':
        return <LogsPanel />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
