import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { toSnakeCase, toCamelCase, INVOICE_FIELD_MAP } from '@/lib/caseConverters';
import { logActivity } from '@/lib/activityLogger';

export interface Invoice {
  id: string;
  numero: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  status: 'pendente' | 'pago' | 'atrasado';
  dataEmissao: string;
  dataVencimento: string;
  dataRecebimento?: string;
  valorBruto: number;
  irrf: number;
  csll: number;
  pis: number;
  cofins: number;
  valorEmitido: number;
  valorRecebido: number;
  valorLivreImpostos: number;
  valorLivre: number;
  cliente?: string;
  clienteId?: string;
  numeroParcela?: number;
  valorParcela?: number;
  totalParcelas?: number;
  projetoId?: string;
  projeto?: string;
  tipoProjeto?: string;
}

interface InvoicesContextType {
  invoices: Invoice[];
  loading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

function mapInvoiceFromDb(row: Record<string, unknown>): Invoice {
  const m = toCamelCase(row, INVOICE_FIELD_MAP)
  return {
    ...(m as unknown as Invoice),
    valorBruto: (m.valorBruto as number) || 0,
    irrf: (m.irrf as number) || 0,
    csll: (m.csll as number) || 0,
    pis: (m.pis as number) || 0,
    cofins: (m.cofins as number) || 0,
    valorEmitido: (m.valorEmitido as number) || 0,
    valorRecebido: (m.valorRecebido as number) || 0,
    valorLivreImpostos: (m.valorLivreImpostos as number) || 0,
    valorLivre: (m.valorLivre as number) || 0,
  }
}

export const InvoicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  logger.debug('[InvoicesProvider] Montando provider');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('invoices').select('*').then(({ data, error }) => {
      if (error) logger.error('Erro ao carregar invoices:', error);
      if (data) setInvoices(data.map(row => mapInvoiceFromDb(row as Record<string, unknown>)));
      setLoading(false);
    });
  }, []);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    setLoading(true);
    const supabaseData = toSnakeCase(invoiceData as unknown as Record<string, unknown>, INVOICE_FIELD_MAP);
    const { data, error } = await supabase.from('invoices').insert(supabaseData).select();
    if (error) {
      logger.error('Erro ao adicionar invoice:', error);
      throw error;
    }
    if (data && data.length > 0) {
      const added = mapInvoiceFromDb(data[0] as Record<string, unknown>);
      setInvoices((prev) => [...prev, added]);
      void logActivity({ action: 'create', entityType: 'nota', entityId: added.id, entityName: added.numero });
    }
    setLoading(false);
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    setLoading(true);
    const filtered = Object.fromEntries(
      Object.entries(invoiceData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    const supabaseData = toSnakeCase(filtered, INVOICE_FIELD_MAP);
    const { data, error } = await supabase.from('invoices').update(supabaseData).eq('id', id).select();
    if (error) {
      logger.error('Erro ao atualizar invoice:', error);
      throw error;
    }
    if (data && data.length > 0) {
      const updated = mapInvoiceFromDb(data[0] as Record<string, unknown>);
      setInvoices((prev) => prev.map(inv => inv.id === id ? updated : inv));
      void logActivity({ action: 'update', entityType: 'nota', entityId: id, entityName: updated.numero });
    }
    setLoading(false);
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      logger.error('Erro ao deletar invoice:', error);
      throw error;
    }
    setInvoices((prev) => prev.filter(inv => inv.id !== id));
    void logActivity({ action: 'delete', entityType: 'nota', entityId: id });
    setLoading(false);
  };

  return (
    <InvoicesContext.Provider value={{ invoices, loading, addInvoice, updateInvoice, deleteInvoice }}>
      {children}
    </InvoicesContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoicesContext);
  logger.debug('[useInvoices] Chamado, contexto:', context);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
};
