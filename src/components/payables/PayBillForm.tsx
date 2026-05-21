import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';

interface PayBillFormProps {
  onSuccess?: () => void;
}

const PayBillForm: React.FC<PayBillFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fornecedores, setFornecedores] = useState<{ id: string; razao_social: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    fornecedor_id: '',
    mes_referencia: '',
    data_vencimento: '',
    data_pagamento: '',
    categoria: '',
    valor: '',
    status: 'pendente',
  });

  useEffect(() => {
    supabase.from('suppliers').select('id, razao_social').then(({ data }) => {
      setFornecedores(data ?? []);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }
      const payload = {
        fornecedor_id: fields.fornecedor_id,
        mes_referencia: fields.mes_referencia,
        data_vencimento: fields.data_vencimento || null,
        data_pagamento: fields.data_pagamento || null,
        categoria: fields.categoria,
        valor: fields.valor,
        status: fields.status,
      };
      const { data, error: supaError } = await supabase.from('pay_bills').insert([payload]).select();
      if (supaError) {
        setError(supaError.message);
        toast({ title: 'Erro ao cadastrar boleto', description: supaError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Boleto cadastrado!', description: 'O boleto foi cadastrado com sucesso.' });
        const fornecedorNome = fornecedores.find(f => f.id === fields.fornecedor_id)?.razao_social;
        void logActivity({ action: 'create', entityType: 'boleto', entityId: data?.[0]?.id, entityName: fornecedorNome });
        setFields({ fornecedor_id: '', mes_referencia: '', data_vencimento: '', data_pagamento: '', categoria: '', valor: '', status: 'pendente' });
        if (onSuccess) onSuccess();
        else navigate('/dashboard/pagar');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao salvar boleto.');
      toast({ title: 'Erro ao cadastrar boleto', description: msg, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cadastro de Boleto</h2>
          <p className="text-gray-600">Preencha os dados do boleto a pagar</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fornecedor *</label>
              <select name="fornecedor_id" value={fields.fornecedor_id} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
                <option value="">Selecione o fornecedor</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.razao_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria *</label>
              <input name="categoria" type="text" value={fields.categoria} onChange={handleChange} required className="border rounded px-2 py-1 w-full" placeholder="Ex: Energia, Internet, Aluguel..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mês de Referência *</label>
              <input name="mes_referencia" type="month" value={fields.mes_referencia} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor *</label>
              <input name="valor" type="number" min="0" step="0.01" value={fields.valor} onChange={handleChange} required className="border rounded px-2 py-1 w-full" placeholder="R$" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select name="status" value={fields.status} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Vencimento *</label>
              <input name="data_vencimento" type="date" value={fields.data_vencimento} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
              <input name="data_pagamento" type="date" value={fields.data_pagamento} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Boleto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PayBillForm;
