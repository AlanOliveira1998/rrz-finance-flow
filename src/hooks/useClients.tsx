
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Client {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  endereco: any;
  ativo: boolean;
  created_at?: string;
}

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  addClient: (clientData: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientByCnpj: (cnpj: string) => Promise<any>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('clients').select('*').then(({ data, error }) => {
      if (!error && data) setClients(data as Client[]);
      setLoading(false);
    });
  }, []);

  const getClientByCnpj = async (cnpj: string) => {
    try {
      // Limpar o CNPJ removendo caracteres não numéricos
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      // Validar se o CNPJ tem 14 dígitos
      if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      // Tentar a API da Receita Federal (mais confiável)
      const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Se a primeira API falhar, tentar a BrasilAPI como fallback
        const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        
        if (!brasilApiResponse.ok) {
          throw new Error('CNPJ não encontrado. Verifique se o CNPJ está correto e tente novamente.');
        }
        
        const brasilApiData = await brasilApiResponse.json();
        
        return {
          razaoSocial: brasilApiData.razao_social || '',
          nomeFantasia: brasilApiData.nome_fantasia || '',
          cnpj: brasilApiData.cnpj || cleanCnpj,
          email: brasilApiData.email || '',
          telefone: brasilApiData.ddd_telefone_1 ? `(${brasilApiData.ddd_telefone_1.substring(0,2)}) ${brasilApiData.ddd_telefone_1.substring(2)}` : '',
          endereco: {
            logradouro: brasilApiData.logradouro || '',
            numero: brasilApiData.numero || '',
            complemento: brasilApiData.complemento || '',
            bairro: brasilApiData.bairro || '',
            cidade: brasilApiData.municipio || '',
            uf: brasilApiData.uf || '',
            cep: brasilApiData.cep || ''
          }
        };
      }

      const data = await response.json();
      
      // Verificar se a resposta contém dados válidos
      if (!data.nome) {
        throw new Error('CNPJ encontrado mas sem dados válidos');
      }

      return {
        razaoSocial: data.nome || '',
        nomeFantasia: data.fantasia || '',
        cnpj: data.cnpj || cleanCnpj,
        email: data.email || '',
        telefone: data.telefone ? data.telefone : '',
        endereco: {
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || ''
        }
      };
    } catch (error) {
      console.error('Erro na consulta do CNPJ:', error);
      
      // Se todas as APIs falharem, retornar erro mais amigável
      if (error.message.includes('CNPJ não encontrado')) {
        throw new Error('CNPJ não encontrado. Verifique se o CNPJ está correto e tente novamente.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        throw new Error('Erro ao consultar CNPJ. Tente novamente em alguns segundos.');
      }
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at'>) => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').insert([{ ...clientData }]).select();
    if (!error && data) setClients((prev) => [...prev, data[0] as Client]);
    setLoading(false);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').update(clientData).eq('id', id).select();
    if (!error && data) setClients((prev) => prev.map(c => c.id === id ? { ...c, ...data[0] } : c));
    setLoading(false);
  };

  const deleteClient = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) setClients((prev) => prev.filter(c => c.id !== id));
    setLoading(false);
  };

  return (
    <ClientsContext.Provider value={{ clients, loading, addClient, updateClient, deleteClient, getClientByCnpj }}>
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
