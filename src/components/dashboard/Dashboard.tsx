import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { HomeOverview } from '@/components/dashboard/HomeOverview';
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard';
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
import { ProposalsList } from '@/components/proposals/ProposalsList';
import { ProposalForm } from '@/components/proposals/ProposalForm';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PayBillsTable } from './PayBillsTable';
import Checklist from './Checklist';
import KanbanAtividades from './KanbanAtividades';
import LogsPanel from './LogsPanel';
import SupplierForm from '@/components/suppliers/SupplierForm';
import SupplierList from '@/components/suppliers/SupplierList';
import PayBillForm from '@/components/payables/PayBillForm';

export const Dashboard = () => {
  const navigate = useNavigate();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<import('@/hooks/useProposals').Proposal | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="" element={<HomeOverview />} />
            <Route path="financeiro" element={<FinancialDashboard />} />
            <Route path="receber" element={<DashboardOverview />} />
            <Route path="pagar" element={<PayBillsTable />} />
            <Route path="pagar/boleto/novo" element={<PayBillForm onSuccess={() => navigate('/dashboard/pagar')} />} />
            <Route path="pagar/fornecedores" element={<SupplierList />} />
            <Route path="pagar/fornecedores/novo" element={<SupplierForm onSuccess={() => navigate('/dashboard/pagar/fornecedores')} />} />
            <Route path="kanban" element={<KanbanAtividades />} />
            <Route path="checklist" element={<Checklist />} />
            <Route path="proposals" element={<ProposalsList onEdit={p => { setSelectedProposal(p); navigate('/dashboard/edit-proposal'); }} />} />
            <Route path="new-proposal" element={<ProposalForm onBack={() => navigate('/dashboard/proposals')} />} />
            <Route path="edit-proposal" element={<ProposalForm proposal={selectedProposal} onBack={() => { setSelectedProposal(null); navigate('/dashboard/proposals'); }} />} />
            <Route path="invoices" element={<InvoiceList onEdit={inv => { setSelectedInvoice(inv); navigate('/dashboard/new-invoice'); }} onNew={() => { setSelectedInvoice(null); navigate('/dashboard/new-invoice'); }} />} />
            <Route path="new-invoice" element={<InvoiceForm invoice={selectedInvoice} onBack={() => navigate('/dashboard/invoices')} />} />
            <Route path="clients" element={<ClientList onEdit={c => { setSelectedClient(c); navigate('/dashboard/new-client'); }} />} />
            <Route path="new-client" element={<ClientForm client={selectedClient} onBack={() => setSelectedClient(null)} />} />
            <Route path="projects" element={<ProjectList onEdit={p => { setSelectedProject(p); navigate('/dashboard/new-project'); }} />} />
            <Route path="new-project" element={<ProjectForm project={selectedProject} onBack={() => setSelectedProject(null)} />} />
            <Route path="taxes" element={<TaxesList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<PermissionGuard require="canManageUsers"><UserManagement /></PermissionGuard>} />
            <Route path="logs" element={<LogsPanel />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
