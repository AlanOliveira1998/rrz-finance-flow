import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

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
}

const ProposalsContext = createContext<ProposalsContextType | undefined>(undefined);

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
        if (error) {
          logger.error('Erro ao carregar proposals:', error);
        }
        if (data) {
          const mapped: Proposal[] = data.map((p: any) => ({
            id: p.id,
            clientId: p.client_id,
            projectId: p.project_id,
            valor: p.valor,
            status: p.status,
            docuSignId: p.docusign_id,
            observacoes: p.observacoes,
            arquivoUrl: p.arquivo_url,
            created_at: p.created_at,
          }));
          setProposals(mapped);
        }
        setLoading(false);
      });
  }, []);

  const addProposal = async (proposal: Omit<Proposal, 'id' | 'created_at'>) => {
    setLoading(true);
    const payload = {
      client_id: proposal.clientId,
      project_id: proposal.projectId ?? null,
      valor: proposal.valor ?? null,
      status: proposal.status,
      docusign_id: proposal.docuSignId ?? null,
      observacoes: proposal.observacoes ?? null,
      arquivo_url: proposal.arquivoUrl ?? null,
    };

    const { data, error } = await supabase.from('proposals').insert([payload]).select();
    if (error) {
      setLoading(false);
      throw error;
    }
    if (data && data[0]) {
      const created: Proposal = {
        id: data[0].id,
        clientId: data[0].client_id,
        projectId: data[0].project_id,
        valor: data[0].valor,
        status: data[0].status,
        docuSignId: data[0].docusign_id,
        observacoes: data[0].observacoes,
        arquivoUrl: data[0].arquivo_url,
        created_at: data[0].created_at,
      };
      setProposals((prev) => [created, ...prev]);
    }
    setLoading(false);
  };

  return (
    <ProposalsContext.Provider value={{ proposals, loading, addProposal }}>
      {children}
    </ProposalsContext.Provider>
  );
};

export const useProposals = () => {
  const ctx = useContext(ProposalsContext);
  if (!ctx) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return ctx;
};

