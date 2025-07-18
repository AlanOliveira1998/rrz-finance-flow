import React, { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const TaxesList = () => {
  const { invoices } = useInvoices();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtrar por data de emissão
  const filteredInvoices = invoices.filter((inv) => {
    const dataEmissao = new Date(inv.dataEmissao);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && dataEmissao < start) return false;
    if (end && dataEmissao > end) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Impostos</h2>
        <p className="text-gray-600">Resumo de impostos de todas as notas fiscais</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Impostos</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data início</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data fim</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Bruto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IRRF (1,5%)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CSLL (1%)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PIS (0,65%)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">COFINS (3%)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Líquido</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{inv.numero}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.valorBruto)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.irrf)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.csll)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.pis)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(inv.cofins)}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-bold text-blue-700">{formatCurrency(inv.valorLivreImpostos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 