
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Client {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  ativo: boolean;
  dataCadastro: string;
}

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'dataCadastro'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientByCnpj: (cnpj: string) => Promise<any>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const savedClients = localStorage.getItem('rrz_clients');
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  const getClientByCnpj = async (cnpj: string) => {
    try {
      const cleanCnpj = cnpj.replace(/\D/g, '');
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado');
      }
      
      const data = await response.json();
      return {
        razaoSocial: data.legal_name || data.company_name,
        nomeFantasia: data.trade_name || data.fantasy_name,
        cnpj: data.cnpj,
        email: data.email,
        telefone: data.phone,
        endereco: {
          logradouro: data.address?.street || '',
          numero: data.address?.number || '',
          complemento: data.address?.details || '',
          bairro: data.address?.district || '',
          cidade: data.address?.city || '',
          uf: data.address?.state || '',
          cep: data.address?.zip_code || ''
        }
      };
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      throw error;
    }
  };

  const addClient = (clientData: Omit<Client, 'id' | 'dataCadastro'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      dataCadastro: new Date().toISOString().split('T')[0]
    };
    
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    localStorage.setItem('rrz_clients', JSON.stringify(updatedClients));
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    const updatedClients = clients.map(client => 
      client.id === id ? { ...client, ...clientData } : client
    );
    setClients(updatedClients);
    localStorage.setItem('rrz_clients', JSON.stringify(updatedClients));
  };

  const deleteClient = (id: string) => {
    const updatedClients = clients.filter(client => client.id !== id);
    setClients(updatedClients);
    localStorage.setItem('rrz_clients', JSON.stringify(updatedClients));
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, deleteClient, getClientByCnpj }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};
