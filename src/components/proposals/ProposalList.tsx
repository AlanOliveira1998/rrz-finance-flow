import React from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProposalList: React.FC = () => {
  const { invoices, loading } = useInvoices();
  const proposals = invoices.filter(inv => inv.proposalUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Propostas Anexadas</h2>
        <p className="text-gray-600">Veja todas as propostas anexadas às notas fiscais</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Propostas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proposta</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8">Carregando...</td></tr>
                ) : proposals.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8">Nenhuma proposta anexada.</td></tr>
                ) : (
                  proposals.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2 font-medium text-gray-900">{inv.cliente || '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{inv.numero}</td>
                      <td className="px-4 py-2 text-gray-700">R$ {inv.valorBruto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 text-gray-700">{inv.dataVencimento}</td>
                      <td className="px-4 py-2 text-blue-600 underline">
                        <a href={inv.proposalUrl!} target="_blank" rel="noopener noreferrer">Ver Proposta</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalList; 