
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

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('new-invoice');
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
        return <ClientList />;
      case 'new-client':
        return <ClientForm />;
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
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
