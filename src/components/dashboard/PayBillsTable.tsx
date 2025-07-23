import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export const PayBillsTable: React.FC = () => {
  const [bills, setBills] = React.useState<any[]>([]);
  const [loadingBills, setLoadingBills] = React.useState(false);
  const [editBillId, setEditBillId] = React.useState<string | null>(null);
  const [editFields, setEditFields] = React.useState<any>({});
  const { toast } = useToast();
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);

  React.useEffect(() => {
    setLoadingBills(true);
    supabase.from('pay_bills').select('*').then(({ data }) => {
      setBills(data || []);
      setLoadingBills(false);
    });
    supabase.from('suppliers').select('id, razao_social').then(({ data }) => {
      setFornecedores(data || []);
    });
  }, []);

  const handleEditField = (id: string, field: string, value: any) => {
    setEditFields((prev: any) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id: string) => {
    const fields = editFields[id];
    if (!fields) return;
    setLoadingBills(true);
    const { error } = await supabase.from('pay_bills').update(fields).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar boleto', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Boleto atualizado', description: 'O boleto foi atualizado com sucesso.' });
      setBills(bills => bills.map(b => b.id === id ? { ...b, ...fields } : b));
      setEditBillId(null);
      setEditFields((prev: any) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
    setLoadingBills(false);
  };

  const getFornecedorNome = (id: string) => fornecedores.find(f => f.id === id)?.razao_social || '-';

  // Resumo dos valores
  const today = new Date().toISOString().slice(0, 10);
  const totalPago = bills.filter(b => b.status === 'pago').reduce((sum, b) => sum + Number(b.valor || 0), 0);
  const totalVencido = bills.filter(b => (b.status === 'atrasado') || (b.status === 'pendente' && b.data_vencimento && b.data_vencimento < today)).reduce((sum, b) => sum + Number(b.valor || 0), 0);
  const totalPendente = bills.filter(b => b.status === 'pendente' && b.data_vencimento && b.data_vencimento >= today).reduce((sum, b) => sum + Number(b.valor || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Contas a Pagar</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border-0 rounded shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pago</p>
              <p className="text-2xl font-bold text-green-600">{totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="text-2xl">✔️</div>
          </div>
        </div>
        <div className="bg-yellow-50 border-0 rounded shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">A Pagar</p>
              <p className="text-2xl font-bold text-yellow-600">{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="text-2xl">💸</div>
          </div>
        </div>
        <div className="bg-red-50 border-0 rounded shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencido</p>
              <p className="text-2xl font-bold text-red-600">{totalVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">Boletos Cadastrados</h3>
        {loadingBills ? (
          <div className="text-center py-8">Carregando boletos...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum boleto cadastrado.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Fornecedor</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Categoria</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Mês Ref.</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Valor</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Vencimento</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Pagamento</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map(bill => (
                <tr key={bill.id}>
                  <td className="px-2 py-1 whitespace-nowrap">{getFornecedorNome(bill.fornecedor_id)}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{bill.categoria}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{bill.mes_referencia}</td>
                  <td className="px-2 py-1 whitespace-nowrap">R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{bill.data_vencimento}</td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {editBillId === bill.id ? (
                      <input type="date" value={editFields[bill.id]?.data_pagamento ?? bill.data_pagamento ?? ''} onChange={e => handleEditField(bill.id, 'data_pagamento', e.target.value)} className="border rounded px-1 py-0.5 w-28 text-xs" />
                    ) : (
                      bill.data_pagamento || '-'
                    )}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {editBillId === bill.id ? (
                      <select value={editFields[bill.id]?.status ?? bill.status ?? ''} onChange={e => handleEditField(bill.id, 'status', e.target.value)} className="border rounded px-1 py-0.5 w-24 text-xs">
                        <option value="">Selecione</option>
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                      </select>
                    ) : (
                      bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : '-'
                    )}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    {editBillId === bill.id ? (
                      <>
                        <button className="text-green-600 font-bold mr-2" onClick={() => handleSave(bill.id)}>Salvar</button>
                        <button className="text-gray-500" onClick={() => { setEditBillId(null); setEditFields((prev: any) => { const copy = { ...prev }; delete copy[bill.id]; return copy; }); }}>Cancelar</button>
                      </>
                    ) : (
                      <button className="text-blue-600 font-bold" onClick={() => setEditBillId(bill.id)}>Editar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}; 