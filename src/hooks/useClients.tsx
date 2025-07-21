
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

export interface Client {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  ativo: boolean;
  created_at?: string;
}

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  addClient: (clientData: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientByCnpj: (cnpj: string) => Promise<{
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  }>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshSession } = useAuth();

  useEffect(() => {
    setLoading(true);
    console.log('Carregando clientes...');
    
    supabase.from('clients').select('*').then(({ data, error }) => {
      console.log('Resposta do carregamento de clientes:', { data, error });
      
      if (error) {
        console.error('Erro ao carregar clientes:', error);
      }
      
      if (data) {
        console.log('Clientes carregados:', data);
        // Converter snake_case para camelCase
        const convertedClients = data.map(client => ({
          id: client.id,
          cnpj: client.cnpj,
          razaoSocial: client.razao_social,
          nomeFantasia: client.nome_fantasia,
          email: client.email,
          telefone: client.telefone,
          endereco: client.endereco,
          ativo: client.ativo,
          created_at: client.created_at
        }));
        setClients(convertedClients as Client[]);
      }
      
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
    console.log('Tentando adicionar cliente:', clientData);
    
    // Verificar autenticação primeiro
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Status de autenticação:', { session: !!session, authError });
    
    if (!session) {
      console.error('Usuário não está autenticado');
      throw new Error('Usuário não está autenticado. Faça login novamente.');
    }
    
    // Limpar e validar dados antes de converter
    const cleanClientData = {
      cnpj: clientData.cnpj || '',
      razaoSocial: clientData.razaoSocial || '',
      nomeFantasia: clientData.nomeFantasia || '',
      email: clientData.email || '',
      telefone: clientData.telefone || '',
      endereco: {
        logradouro: clientData.endereco?.logradouro || '',
        numero: clientData.endereco?.numero || '',
        complemento: clientData.endereco?.complemento || '',
        bairro: clientData.endereco?.bairro || '',
        cidade: clientData.endereco?.cidade || '',
        uf: clientData.endereco?.uf || '',
        cep: clientData.endereco?.cep || ''
      },
      ativo: clientData.ativo ?? true
    };

    // Converter camelCase para snake_case para o Supabase
    const supabaseData = {
      cnpj: cleanClientData.cnpj,
      razao_social: cleanClientData.razaoSocial,
      nome_fantasia: cleanClientData.nomeFantasia,
      email: cleanClientData.email,
      telefone: cleanClientData.telefone,
      endereco: cleanClientData.endereco,
      ativo: cleanClientData.ativo
    };
    
    console.log('Dados originais:', clientData);
    console.log('Dados limpos:', cleanClientData);
    console.log('Dados convertidos para Supabase:', supabaseData);
    console.log('Tipo dos dados:', typeof supabaseData);
    console.log('JSON dos dados:', JSON.stringify(supabaseData, null, 2));
    console.log('Usuário autenticado:', session.user.id);
    
    // Teste de conexão primeiro
    console.log('Testando conexão...');
    const { data: testData, error: testError } = await supabase.from('clients').select('count').limit(1);
    console.log('Teste de conexão:', { testData, testError });
    
    if (testError) {
      console.error('Erro na conexão:', testError);
      throw new Error(`Erro de conexão: ${testError.message}`);
    }
    
    // Teste com dados mínimos primeiro
    const minimalData = {
      cnpj: cleanClientData.cnpj,
      razao_social: cleanClientData.razaoSocial,
      ativo: cleanClientData.ativo
    };
    
    console.log('Tentando inserção mínima:', minimalData);
    
    const { data, error } = await supabase.from('clients').insert(minimalData).select();
    
    console.log('Resposta do Supabase:', { data, error });
    
    if (error) {
      console.error('Erro ao adicionar cliente:', error);
      
      // Se for erro de RLS, tentar recarregar a sessão
      if (error.message.includes('new row violates row-level security policy')) {
        console.log('Erro de RLS detectado, tentando recarregar sessão...');
        const sessionRefreshed = await refreshSession();
        if (sessionRefreshed) {
          console.log('Sessão recarregada, tentando inserção novamente...');
          const { data: retryData, error: retryError } = await supabase.from('clients').insert(supabaseData).select();
          if (retryError) {
            console.error('Erro persistente após recarregar sessão:', retryError);
            throw retryError;
          }
          if (retryData && retryData.length > 0) {
            console.log('Cliente adicionado com sucesso na segunda tentativa:', retryData[0]);
            const client = {
              id: retryData[0].id,
              cnpj: retryData[0].cnpj,
              razaoSocial: retryData[0].razao_social,
              nomeFantasia: retryData[0].nome_fantasia,
              email: retryData[0].email,
              telefone: retryData[0].telefone,
              endereco: retryData[0].endereco,
              ativo: retryData[0].ativo,
              created_at: retryData[0].created_at
            };
            setClients((prev) => [...prev, client as Client]);
            setLoading(false);
            return;
          }
        }
      }
      
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('Cliente adicionado com sucesso:', data[0]);
      // Converter de volta para camelCase
      const client = {
        id: data[0].id,
        cnpj: data[0].cnpj,
        razaoSocial: data[0].razao_social,
        nomeFantasia: data[0].nome_fantasia,
        email: data[0].email,
        telefone: data[0].telefone,
        endereco: data[0].endereco,
        ativo: data[0].ativo,
        created_at: data[0].created_at
      };
      setClients((prev) => [...prev, client as Client]);
    } else {
      console.error('Nenhum dado retornado após inserção');
    }
    
    setLoading(false);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setLoading(true);
    
    // Converter camelCase para snake_case
    const supabaseData: Record<string, unknown> = {};
    if (clientData.cnpj !== undefined) supabaseData.cnpj = clientData.cnpj;
    if (clientData.razaoSocial !== undefined) supabaseData.razao_social = clientData.razaoSocial;
    if (clientData.nomeFantasia !== undefined) supabaseData.nome_fantasia = clientData.nomeFantasia;
    if (clientData.email !== undefined) supabaseData.email = clientData.email;
    if (clientData.telefone !== undefined) supabaseData.telefone = clientData.telefone;
    if (clientData.endereco !== undefined) supabaseData.endereco = clientData.endereco;
    if (clientData.ativo !== undefined) supabaseData.ativo = clientData.ativo;
    
    const { data, error } = await supabase.from('clients').update(supabaseData).eq('id', id).select();
    if (!error && data && data.length > 0) {
      const updatedClient = {
        id: data[0].id,
        cnpj: data[0].cnpj,
        razaoSocial: data[0].razao_social,
        nomeFantasia: data[0].nome_fantasia,
        email: data[0].email,
        telefone: data[0].telefone,
        endereco: data[0].endereco,
        ativo: data[0].ativo,
        created_at: data[0].created_at
      };
      setClients((prev) => prev.map(c => c.id === id ? updatedClient : c));
    }
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
