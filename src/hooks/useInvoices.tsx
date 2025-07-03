import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface InvoicesContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

const InvoicesContext = createContext<InvoicesContextType | undefined>(undefined);

export const InvoicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('rrz_invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    } else {
      const sampleInvoices: Invoice[] = [
        {
          id: '1',
          numero: 'NF-001',
          descricao: 'Consultoria em Gestão Financeira',
          tipo: 'entrada',
          status: 'pago',
          dataEmissao: '2024-01-15',
          dataVencimento: '2024-02-15',
          dataRecebimento: '2024-02-10',
          valorBruto: 10000,
          irrf: 150,
          csll: 100,
          pis: 65,
          cofins: 300,
          valorEmitido: 9385,
          valorRecebido: 9385,
          valorLivreImpostos: 9385,
          valorLivre: 8500,
          cliente: 'Empresa ABC Ltda',
          numeroParcela: 1,
          totalParcelas: 1,
          valorParcela: 10000
        },
        {
          id: '2',
          numero: 'NF-002',
          descricao: 'Auditoria Contábil',
          tipo: 'entrada',
          status: 'pendente',
          dataEmissao: '2024-02-01',
          dataVencimento: '2024-03-01',
          valorBruto: 15000,
          irrf: 225,
          csll: 150,
          pis: 97.5,
          cofins: 450,
          valorEmitido: 14077.5,
          valorRecebido: 0,
          valorLivreImpostos: 14077.5,
          valorLivre: 12750,
          cliente: 'Empresa XYZ S.A.',
          numeroParcela: 1,
          totalParcelas: 3,
          valorParcela: 5000
        }
      ];
      setInvoices(sampleInvoices);
      localStorage.setItem('rrz_invoices', JSON.stringify(sampleInvoices));
    }
  }, []);

  const addInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString()
    };
    
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('rrz_invoices', JSON.stringify(updatedInvoices));
  };

  const updateInvoice = (id: string, invoiceData: Partial<Invoice>) => {
    const updatedInvoices = invoices.map(inv => 
      inv.id === id ? { ...inv, ...invoiceData } : inv
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('rrz_invoices', JSON.stringify(updatedInvoices));
  };

  const deleteInvoice = (id: string) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('rrz_invoices', JSON.stringify(updatedInvoices));
  };

  return (
    <InvoicesContext.Provider value={{ invoices, addInvoice, updateInvoice, deleteInvoice }}>
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
