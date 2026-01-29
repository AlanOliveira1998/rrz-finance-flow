import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

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

export const useClientsSimple = () => {
  const [loading, setLoading] = useState(false);

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at'>) => {
    setLoading(true);
    logger.debug('Tentando adicionar cliente (versão simples):', clientData);
    
    try {
      // Verificar autenticação
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      logger.debug('Status de autenticação:', { session: !!session, authError });
      
      if (!session) {
        logger.error('Usuário não está autenticado');
        throw new Error('Usuário não está autenticado. Faça login novamente.');
      }

      // Limpar e validar dados
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

      // Converter para snake_case
      const supabaseData = {
        cnpj: cleanClientData.cnpj,
        razao_social: cleanClientData.razaoSocial,
        nome_fantasia: cleanClientData.nomeFantasia,
        email: cleanClientData.email,
        telefone: cleanClientData.telefone,
        endereco: cleanClientData.endereco,
        ativo: cleanClientData.ativo
      };
      
      logger.debug('Dados para Supabase:', supabaseData);
      logger.debug('Usuário autenticado:', session.user.id);
      
      const { data, error } = await supabase.from('clients').insert([supabaseData]).select();
      
      logger.debug('Resposta do Supabase:', { data, error });
      
      if (error) {
        logger.error('Erro ao adicionar cliente:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        logger.debug('Cliente adicionado com sucesso:', data[0]);
        return data[0];
      } else {
        logger.error('Nenhum dado retornado após inserção');
        throw new Error('Nenhum dado retornado após inserção');
      }
      
    } catch (error) {
      logger.error('Erro na função addClient:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getClientByCnpj = async (cnpj: string) => {
    try {
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
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
      
      if (!data.razao_social) {
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

  return {
    loading,
    addClient,
    getClientByCnpj
  };
}; 