import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

export const ClientFormMinimal = () => {
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      logger.debug('Tentando cadastrar cliente mínimo...');
      
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      logger.debug('Sessão:', session);
      logger.debug('Usuário ID:', session?.user?.id);
      logger.debug('Usuário Email:', session?.user?.email);
      
      if (!session) {
        alert('Usuário não está autenticado');
        return;
      }

      // Dados mínimos
      const clientData = {
        cnpj: cnpj,
        razao_social: razaoSocial,
        ativo: true
      };
      
      logger.debug('Dados sendo enviados:', clientData);
      logger.debug('Tipo dos dados:', typeof clientData);
      logger.debug('JSON dos dados:', JSON.stringify(clientData, null, 2));
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData]) // Corrigido: agora é um array
        .select();
      
      if (error) {
        logger.error('Erro:', error);
        alert(`Erro: ${error.message}`);
      } else {
        logger.debug('Sucesso:', data);
        alert('Cliente cadastrado com sucesso!');
        setCnpj('');
        setRazaoSocial('');
      }
      
    } catch (error) {
      logger.error('Exceção:', error);
      alert(`Exceção: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Cadastro Mínimo de Cliente</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            CNPJ *
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Razão Social *
          </label>
          <input
            type="text"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
        </button>
      </form>
      
      <div className="mt-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">
          <strong>Status:</strong> {loading ? 'Processando...' : 'Pronto'}
        </p>
      </div>
    </div>
  );
}; 