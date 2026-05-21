import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface HourBankContract {
  id: string;
  clientId: string;
  projectName: string;
  startDate: string;
  monthlyHours: number;
  monthlyFee: number;
  hourlyRate: number;
  hasCutClause: boolean;
  cutClauseMonths: number;
  status: 'ativo' | 'encerrado';
  created_at?: string;
}

export interface TimesheetEntry {
  id: string;
  contractId: string;
  importBatchId?: string;
  clientName?: string;
  projectName?: string;
  taskTitle?: string;
  userName?: string;
  description?: string;
  endDate: string;
  durationMinutes: number;
  created_at?: string;
}

type ContractInput = Omit<HourBankContract, 'id' | 'created_at'>;

interface HourBankContractsContextType {
  contracts: HourBankContract[];
  loading: boolean;
  addContract: (data: ContractInput) => Promise<HourBankContract>;
  updateContract: (id: string, data: Partial<ContractInput>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  refresh: () => void;
}

const Ctx = createContext<HourBankContractsContextType | undefined>(undefined);

function fromDb(row: Record<string, unknown>): HourBankContract {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    projectName: row.project_name as string,
    startDate: row.start_date as string,
    monthlyHours: Number(row.monthly_hours),
    monthlyFee: Number(row.monthly_fee),
    hourlyRate: Number(row.hourly_rate),
    hasCutClause: Boolean(row.has_cut_clause),
    cutClauseMonths: Number(row.cut_clause_months),
    status: (row.status as 'ativo' | 'encerrado') ?? 'ativo',
    created_at: row.created_at as string | undefined,
  };
}

function toDb(data: Partial<ContractInput>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (data.clientId !== undefined) r.client_id = data.clientId;
  if (data.projectName !== undefined) r.project_name = data.projectName;
  if (data.startDate !== undefined) r.start_date = data.startDate;
  if (data.monthlyHours !== undefined) r.monthly_hours = data.monthlyHours;
  if (data.monthlyFee !== undefined) r.monthly_fee = data.monthlyFee;
  if (data.hourlyRate !== undefined) r.hourly_rate = data.hourlyRate;
  if (data.hasCutClause !== undefined) r.has_cut_clause = data.hasCutClause;
  if (data.cutClauseMonths !== undefined) r.cut_clause_months = data.cutClauseMonths;
  if (data.status !== undefined) r.status = data.status;
  return r;
}

export function fromEntryDb(row: Record<string, unknown>): TimesheetEntry {
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    importBatchId: row.import_batch_id as string | undefined,
    clientName: row.client_name as string | undefined,
    projectName: row.project_name as string | undefined,
    taskTitle: row.task_title as string | undefined,
    userName: row.user_name as string | undefined,
    description: row.description as string | undefined,
    endDate: row.end_date as string,
    durationMinutes: Number(row.duration_minutes),
    created_at: row.created_at as string | undefined,
  };
}

export const HourBankContractsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contracts, setContracts] = useState<HourBankContract[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = useCallback(() => {
    setLoading(true);
    supabase
      .from('hour_bank_contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setContracts(data.map(r => fromDb(r as Record<string, unknown>)));
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const addContract = async (data: ContractInput): Promise<HourBankContract> => {
    const { data: rows, error } = await supabase
      .from('hour_bank_contracts')
      .insert([toDb(data)])
      .select();
    if (error) throw error;
    const created = fromDb(rows![0] as Record<string, unknown>);
    setContracts(prev => [created, ...prev]);
    return created;
  };

  const updateContract = async (id: string, data: Partial<ContractInput>) => {
    const { data: rows, error } = await supabase
      .from('hour_bank_contracts')
      .update(toDb(data))
      .eq('id', id)
      .select();
    if (error) throw error;
    if (rows?.[0]) {
      const updated = fromDb(rows[0] as Record<string, unknown>);
      setContracts(prev => prev.map(c => c.id === id ? updated : c));
    }
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase.from('hour_bank_contracts').delete().eq('id', id);
    if (error) throw error;
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Ctx.Provider value={{ contracts, loading, addContract, updateContract, deleteContract, refresh: fetchContracts }}>
      {children}
    </Ctx.Provider>
  );
};

export const useHourBankContracts = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHourBankContracts must be used within HourBankContractsProvider');
  return ctx;
};
