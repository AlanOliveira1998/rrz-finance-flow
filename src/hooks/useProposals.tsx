import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { toSnakeCase, toCamelCase, PROPOSAL_FIELD_MAP } from '@/lib/caseConverters';

export type ProposalStatus = 'rascunho' | 'enviado' | 'assinado' | 'rejeitado';

export interface Proposal {
  id: string;
  clientId: string;
  projectId?: string | null;
  valor?: number | null;
  status: ProposalStatus;
  docuSignId?: string | null;
  observacoes?: string | null;
  arquivoUrl?: string | null;
  created_at?: string;
}

interface ProposalsContextType {
  proposals: Proposal[];
  loading: boolean;
  addProposal: (data: Omit<Proposal, 'id' | 'created_at'>) => Promise<void>;
  updateProposal: (id: string, data: Partial<Omit<Proposal, 'id' | 'created_at'>>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
}

const ProposalsContext = createContext<ProposalsContextType | undefined>(undefined);

function mapProposalFromDb(row: Record<string, unknown>): Proposal {
  return toCamelCase(row, PROPOSAL_FIELD_MAP) as unknown as Proposal
}

export const ProposalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) logger.error('Erro ao carregar proposals:', error);
        if (data) setProposals(data.map(row => mapProposalFromDb(row as Record<string, unknown>)));
        setLoading(false);
      });
  }, []);

  const addProposal = async (proposal: Omit<Proposal, 'id' | 'created_at'>) => {
    setLoading(true);
    const payload = toSnakeCase(proposal as unknown as Record<string, unknown>, PROPOSAL_FIELD_MAP);
    const { data, error } = await supabase.from('proposals').insert([payload]).select();
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data && data[0]) {
      setProposals((prev) => [mapProposalFromDb(data[0] as Record<string, unknown>), ...prev]);
    }
    setLoading(false);
  };

  const updateProposal = async (id: string, data: Partial<Omit<Proposal, 'id' | 'created_at'>>) => {
    setLoading(true);
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    const payload = toSnakeCase(filtered, PROPOSAL_FIELD_MAP);
    const { data: rows, error } = await supabase.from('proposals').update(payload).eq('id', id).select();
    if (error) {
      setLoading(false);
      throw error;
    }
    if (rows && rows[0]) {
      const updated = mapProposalFromDb(rows[0] as Record<string, unknown>);
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
    setLoading(false);
  };

  const deleteProposal = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      setLoading(false);
      throw error;
    }
    setProposals((prev) => prev.filter((p) => p.id !== id));
    setLoading(false);
  };

  return (
    <ProposalsContext.Provider value={{ proposals, loading, addProposal, updateProposal, deleteProposal }}>
      {children}
    </ProposalsContext.Provider>
  );
};

export const useProposals = () => {
  const ctx = useContext(ProposalsContext);
  if (!ctx) throw new Error('useProposals must be used within a ProposalsProvider');
  return ctx;
};
