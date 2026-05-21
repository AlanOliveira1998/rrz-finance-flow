
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { toSnakeCase, toCamelCase, CLIENT_FIELD_MAP } from '@/lib/caseConverters';
import { logActivity } from '@/lib/activityLogger';

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
  refreshClients: () => void;
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

function mapClientFromDb(row: Record<string, unknown>): Client {
  const m = toCamelCase(row, CLIENT_FIELD_MAP)
  const endereco = typeof m.endereco === 'string'
    ? JSON.parse(m.endereco as string)
    : (m.endereco as Client['endereco']) || {}
  return { ...(m as unknown as Client), endereco }
}

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshSession } = useAuth();

  const fetchClients = () => {
    setLoading(true);
    supabase.from('clients').select('*').then(({ data, error }) => {
      if (error) logger.error('Erro ao carregar clientes:', error);
      if (data) setClients(data.map(row => mapClientFromDb(row as Record<string, unknown>)));
      setLoading(false);
    });
  };

  useEffect(() => { fetchClients(); }, []);

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
      logger.error('Erro na consulta do CNPJ:', error);
      
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
    logger.debug('Tentando adicionar cliente:', clientData);
    
    // Verificar autenticação primeiro
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    logger.debug('Status de autenticação:', { session: !!session, authError });
    
    if (!session) {
      logger.error('Usuário não está autenticado');
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

    const supabaseData = toSnakeCase(cleanClientData as unknown as Record<string, unknown>, CLIENT_FIELD_MAP);
    
    logger.debug('Dados originais:', clientData);
    logger.debug('Dados limpos:', cleanClientData);
    logger.debug('Dados convertidos para Supabase:', supabaseData);
    logger.debug('Tipo dos dados:', typeof supabaseData);
    logger.debug('JSON dos dados:', JSON.stringify(supabaseData, null, 2));
    logger.debug('Usuário autenticado:', session.user.id);
    
    const { data, error } = await supabase.from('clients').insert([supabaseData]).select();
    
    logger.debug('Resposta do Supabase:', { data, error });
    
    if (error) {
      logger.error('Erro ao adicionar cliente:', error);
      
      // Se for erro de RLS, tentar recarregar a sessão
      if (error.message.includes('new row violates row-level security policy')) {
        logger.debug('Erro de RLS detectado, tentando recarregar sessão...');
        const sessionRefreshed = await refreshSession();
        if (sessionRefreshed) {
          logger.debug('Sessão recarregada, tentando inserção novamente...');
          const { data: retryData, error: retryError } = await supabase.from('clients').insert([supabaseData]).select();
          if (retryError) {
            logger.error('Erro persistente após recarregar sessão:', retryError);
            throw retryError;
          }
          if (retryData && retryData.length > 0) {
            logger.debug('Cliente adicionado com sucesso na segunda tentativa:', retryData[0]);
            const added = mapClientFromDb(retryData[0] as Record<string, unknown>);
            setClients((prev) => [...prev, added]);
            void logActivity({ action: 'create', entityType: 'cliente', entityId: added.id, entityName: added.razaoSocial });
            setLoading(false);
            return;
          }
        }
      }
      
      throw error;
    }
    
    if (data && data.length > 0) {
      logger.debug('Cliente adicionado com sucesso:', data[0]);
      const added = mapClientFromDb(data[0] as Record<string, unknown>);
      setClients((prev) => [...prev, added]);
      void logActivity({ action: 'create', entityType: 'cliente', entityId: added.id, entityName: added.razaoSocial });
    } else {
      logger.error('Nenhum dado retornado após inserção');
    }
    
    setLoading(false);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setLoading(true);
    const filtered = Object.fromEntries(
      Object.entries(clientData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;
    const supabaseData = toSnakeCase(filtered, CLIENT_FIELD_MAP);
    const { data, error } = await supabase.from('clients').update(supabaseData).eq('id', id).select();
    if (!error && data && data.length > 0) {
      const updated = mapClientFromDb(data[0] as Record<string, unknown>);
      setClients((prev) => prev.map(c => c.id === id ? updated : c));
      void logActivity({ action: 'update', entityType: 'cliente', entityId: id, entityName: updated.razaoSocial });
    }
    setLoading(false);
  };

  const deleteClient = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      setClients((prev) => prev.filter(c => c.id !== id));
      void logActivity({ action: 'delete', entityType: 'cliente', entityId: id });
    }
    setLoading(false);
  };

  return (
    <ClientsContext.Provider value={{ clients, loading, addClient, updateClient, deleteClient, refreshClients: fetchClients, getClientByCnpj }}>
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
