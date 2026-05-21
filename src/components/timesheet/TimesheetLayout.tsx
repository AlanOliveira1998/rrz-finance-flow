import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TimesheetHome } from '@/components/timesheet/TimesheetHome';
import { ContractList } from '@/components/timesheet/ContractList';
import { ContractForm } from '@/components/timesheet/ContractForm';
import { ImportTimesheet } from '@/components/timesheet/ImportTimesheet';
import { ContractDashboard } from '@/components/timesheet/ContractDashboard';
import { HourBankContract } from '@/hooks/useHourBankContracts';

export const TimesheetLayout = () => {
  const navigate = useNavigate();
  const [selectedContract, setSelectedContract] = useState<HourBankContract | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="" element={<TimesheetHome />} />
            <Route
              path="contracts"
              element={
                <ContractList
                  onEdit={c => { setSelectedContract(c); navigate('/timesheet/contracts/edit'); }}
                />
              }
            />
            <Route
              path="contracts/new"
              element={<ContractForm onBack={() => navigate('/timesheet/contracts')} />}
            />
            <Route
              path="contracts/edit"
              element={
                <ContractForm
                  contract={selectedContract}
                  onBack={() => { setSelectedContract(null); navigate('/timesheet/contracts'); }}
                />
              }
            />
            <Route path="import" element={<ImportTimesheet />} />
            <Route path="dashboard/:contractId" element={<ContractDashboard />} />
            <Route path="*" element={<Navigate to="/timesheet" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
