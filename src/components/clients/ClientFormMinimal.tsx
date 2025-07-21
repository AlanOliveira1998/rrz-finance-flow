import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const ClientFormMinimal = () => {
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Tentando cadastrar cliente mínimo...');
      
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão:', session);
      
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
      
      console.log('Dados:', clientData);
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select();
      
      if (error) {
        console.error('Erro:', error);
        alert(`Erro: ${error.message}`);
      } else {
        console.log('Sucesso:', data);
        alert('Cliente cadastrado com sucesso!');
        setCnpj('');
        setRazaoSocial('');
      }
      
    } catch (error) {
      console.error('Exceção:', error);
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