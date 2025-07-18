
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

      // Usar apenas a BrasilAPI com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Se a API falhar, retornar um objeto vazio para permitir preenchimento manual
        return {
          razaoSocial: '',
          nomeFantasia: '',
          cnpj: cleanCnpj,
          email: '',
          telefone: '',
          endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
            cep: ''
          }
        };
      }

      const data = await response.json();
      
      // Verificar se a resposta contém dados válidos
      if (!data.razao_social) {
        // Se não tiver dados válidos, retornar objeto vazio
        return {
          razaoSocial: '',
          nomeFantasia: '',
          cnpj: cleanCnpj,
          email: '',
          telefone: '',
          endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
            cep: ''
          }
        };
      }

      return {
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || '',
        cnpj: data.cnpj || cleanCnpj,
        email: data.email || '',
        telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : '',
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
      
      // Em caso de erro, retornar objeto vazio para permitir preenchimento manual
      const cleanCnpj = cnpj.replace(/\D/g, '');
      return {
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: cleanCnpj,
        email: '',
        telefone: '',
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        }
      };
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
