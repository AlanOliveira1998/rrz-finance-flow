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
  proposalUrl?: string;
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
      if (error) {
        console.error('Erro ao carregar invoices:', error);
      }
      if (data) {
        // Converter snake_case para camelCase
        const convertedInvoices = data.map(invoice => ({
          id: invoice.id,
          numero: invoice.numero,
          descricao: invoice.descricao,
          tipo: invoice.tipo,
          status: invoice.status,
          dataEmissao: invoice.data_emissao,
          dataVencimento: invoice.data_vencimento,
          dataRecebimento: invoice.data_recebimento,
          valorBruto: invoice.valor_bruto || 0,
          irrf: invoice.irrf || 0,
          csll: invoice.csll || 0,
          pis: invoice.pis || 0,
          cofins: invoice.cofins || 0,
          valorEmitido: invoice.valor_emitido || 0,
          valorRecebido: invoice.valor_recebido || 0,
          valorLivreImpostos: invoice.valor_livre_impostos || 0,
          valorLivre: invoice.valor_livre || 0,
          cliente: invoice.cliente,
          clienteId: invoice.cliente_id,
          numeroParcela: invoice.numero_parcela,
          valorParcela: invoice.valor_parcela,
          totalParcelas: invoice.total_parcelas,
          projetoId: invoice.projeto_id,
          projeto: invoice.projeto,
          tipoProjeto: invoice.tipo_projeto,
          proposalUrl: invoice.proposal_url
        }));
        setInvoices(convertedInvoices as Invoice[]);
      }
      setLoading(false);
    });
  }, []);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    setLoading(true);
    
    // Converter camelCase para snake_case
    const supabaseData = {
      numero: invoiceData.numero,
      descricao: invoiceData.descricao,
      tipo: invoiceData.tipo,
      status: invoiceData.status,
      data_emissao: invoiceData.dataEmissao,
      data_vencimento: invoiceData.dataVencimento,
      data_recebimento: invoiceData.dataRecebimento,
      valor_bruto: invoiceData.valorBruto,
      irrf: invoiceData.irrf,
      csll: invoiceData.csll,
      pis: invoiceData.pis,
      cofins: invoiceData.cofins,
      valor_emitido: invoiceData.valorEmitido,
      valor_recebido: invoiceData.valorRecebido,
      valor_livre_impostos: invoiceData.valorLivreImpostos,
      valor_livre: invoiceData.valorLivre,
      cliente: invoiceData.cliente,
      cliente_id: invoiceData.clienteId,
      numero_parcela: invoiceData.numeroParcela,
      valor_parcela: invoiceData.valorParcela,
      total_parcelas: invoiceData.totalParcelas,
      projeto_id: invoiceData.projetoId,
      projeto: invoiceData.projeto,
      tipo_projeto: invoiceData.tipoProjeto,
      proposal_url: invoiceData.proposalUrl
    };
    
    const { data, error } = await supabase.from('invoices').insert([supabaseData]).select();
    if (error) {
      console.error('Erro ao adicionar invoice:', error);
      throw error;
    }
    if (data && data.length > 0) {
      // Converter de volta para camelCase
      const newInvoice = {
        id: data[0].id,
        numero: data[0].numero,
        descricao: data[0].descricao,
        tipo: data[0].tipo,
        status: data[0].status,
        dataEmissao: data[0].data_emissao,
        dataVencimento: data[0].data_vencimento,
        dataRecebimento: data[0].data_recebimento,
        valorBruto: data[0].valor_bruto || 0,
        irrf: data[0].irrf || 0,
        csll: data[0].csll || 0,
        pis: data[0].pis || 0,
        cofins: data[0].cofins || 0,
        valorEmitido: data[0].valor_emitido || 0,
        valorRecebido: data[0].valor_recebido || 0,
        valorLivreImpostos: data[0].valor_livre_impostos || 0,
        valorLivre: data[0].valor_livre || 0,
        cliente: data[0].cliente,
        clienteId: data[0].cliente_id,
        numeroParcela: data[0].numero_parcela,
        valorParcela: data[0].valor_parcela,
        totalParcelas: data[0].total_parcelas,
        projetoId: data[0].projeto_id,
        projeto: data[0].projeto,
        tipoProjeto: data[0].tipo_projeto,
        proposalUrl: data[0].proposal_url
      };
      setInvoices((prev) => [...prev, newInvoice as Invoice]);
    }
    setLoading(false);
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    setLoading(true);
    
    // Converter camelCase para snake_case
    const supabaseData: any = {};
    if (invoiceData.numero !== undefined) supabaseData.numero = invoiceData.numero;
    if (invoiceData.descricao !== undefined) supabaseData.descricao = invoiceData.descricao;
    if (invoiceData.tipo !== undefined) supabaseData.tipo = invoiceData.tipo;
    if (invoiceData.status !== undefined) supabaseData.status = invoiceData.status;
    if (invoiceData.dataEmissao !== undefined) supabaseData.data_emissao = invoiceData.dataEmissao;
    if (invoiceData.dataVencimento !== undefined) supabaseData.data_vencimento = invoiceData.dataVencimento;
    if (invoiceData.dataRecebimento !== undefined) supabaseData.data_recebimento = invoiceData.dataRecebimento;
    if (invoiceData.valorBruto !== undefined) supabaseData.valor_bruto = invoiceData.valorBruto;
    if (invoiceData.irrf !== undefined) supabaseData.irrf = invoiceData.irrf;
    if (invoiceData.csll !== undefined) supabaseData.csll = invoiceData.csll;
    if (invoiceData.pis !== undefined) supabaseData.pis = invoiceData.pis;
    if (invoiceData.cofins !== undefined) supabaseData.cofins = invoiceData.cofins;
    if (invoiceData.valorEmitido !== undefined) supabaseData.valor_emitido = invoiceData.valorEmitido;
    if (invoiceData.valorRecebido !== undefined) supabaseData.valor_recebido = invoiceData.valorRecebido;
    if (invoiceData.valorLivreImpostos !== undefined) supabaseData.valor_livre_impostos = invoiceData.valorLivreImpostos;
    if (invoiceData.valorLivre !== undefined) supabaseData.valor_livre = invoiceData.valorLivre;
    if (invoiceData.cliente !== undefined) supabaseData.cliente = invoiceData.cliente;
    if (invoiceData.clienteId !== undefined) supabaseData.cliente_id = invoiceData.clienteId;
    if (invoiceData.numeroParcela !== undefined) supabaseData.numero_parcela = invoiceData.numeroParcela;
    if (invoiceData.valorParcela !== undefined) supabaseData.valor_parcela = invoiceData.valorParcela;
    if (invoiceData.totalParcelas !== undefined) supabaseData.total_parcelas = invoiceData.totalParcelas;
    if (invoiceData.projetoId !== undefined) supabaseData.projeto_id = invoiceData.projetoId;
    if (invoiceData.projeto !== undefined) supabaseData.projeto = invoiceData.projeto;
    if (invoiceData.tipoProjeto !== undefined) supabaseData.tipo_projeto = invoiceData.tipoProjeto;
    if (invoiceData.proposalUrl !== undefined) supabaseData.proposal_url = invoiceData.proposalUrl;
    
    const { data, error } = await supabase.from('invoices').update(supabaseData).eq('id', id).select();
    if (error) {
      console.error('Erro ao atualizar invoice:', error);
      throw error;
    }
    if (data && data.length > 0) {
      // Converter de volta para camelCase
      const updatedInvoice = {
        id: data[0].id,
        numero: data[0].numero,
        descricao: data[0].descricao,
        tipo: data[0].tipo,
        status: data[0].status,
        dataEmissao: data[0].data_emissao,
        dataVencimento: data[0].data_vencimento,
        dataRecebimento: data[0].data_recebimento,
        valorBruto: data[0].valor_bruto || 0,
        irrf: data[0].irrf || 0,
        csll: data[0].csll || 0,
        pis: data[0].pis || 0,
        cofins: data[0].cofins || 0,
        valorEmitido: data[0].valor_emitido || 0,
        valorRecebido: data[0].valor_recebido || 0,
        valorLivreImpostos: data[0].valor_livre_impostos || 0,
        valorLivre: data[0].valor_livre || 0,
        cliente: data[0].cliente,
        clienteId: data[0].cliente_id,
        numeroParcela: data[0].numero_parcela,
        valorParcela: data[0].valor_parcela,
        totalParcelas: data[0].total_parcelas,
        projetoId: data[0].projeto_id,
        projeto: data[0].projeto,
        tipoProjeto: data[0].tipo_projeto,
        proposalUrl: data[0].proposal_url
      };
      setInvoices((prev) => prev.map(inv => inv.id === id ? updatedInvoice : inv));
    }
    setLoading(false);
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar invoice:', error);
      throw error;
    }
    setInvoices((prev) => prev.filter(inv => inv.id !== id));
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
