import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

export const InvoicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('invoices').select('*').then(({ data, error }) => {
      if (!error && data) setInvoices(data as Invoice[]);
      setLoading(false);
    });
  }, []);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    setLoading(true);
    const { data, error } = await supabase.from('invoices').insert([{ ...invoiceData }]).select();
    if (!error && data) setInvoices((prev) => [...prev, data[0] as Invoice]);
    setLoading(false);
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    setLoading(true);
    const { data, error } = await supabase.from('invoices').update(invoiceData).eq('id', id).select();
    if (!error && data) setInvoices((prev) => prev.map(inv => inv.id === id ? { ...inv, ...data[0] } : inv));
    setLoading(false);
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) setInvoices((prev) => prev.filter(inv => inv.id !== id));
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
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
};
