
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InvoicesProvider } from "@/hooks/useInvoices";
import { ClientsProvider } from "@/hooks/useClients";
import { ProjectsProvider } from "@/hooks/useProjects";
import { ProposalsProvider } from "@/hooks/useProposals";
import { HourBankContractsProvider } from "@/hooks/useHourBankContracts";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Dashboard } from './components/dashboard/Dashboard';
import { TimesheetLayout } from './components/timesheet/TimesheetLayout';
import ResetPassword from '@/pages/ResetPassword';

const App = () => (
  <AuthProvider>
    <ClientsProvider>
      <ProjectsProvider>
        <InvoicesProvider>
          <ProposalsProvider>
            <HourBankContractsProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  <Route path="/timesheet/*" element={<TimesheetLayout />} />
                  <Route path="*" element={<NotFound />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
              </BrowserRouter>
            </HourBankContractsProvider>
          </ProposalsProvider>
        </InvoicesProvider>
      </ProjectsProvider>
    </ClientsProvider>
  </AuthProvider>
);

export default App;
