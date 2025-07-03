
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInvoices } from '@/hooks/useInvoices';

export const Reports = () => {
  const { invoices } = useInvoices();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredInvoices = invoices.filter(invoice => {
    if (!startDate && !endDate) return true;
    const invoiceDate = new Date(invoice.dataEmissao);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    return invoiceDate >= start && invoiceDate <= end;
  });

  const calculateTotals = () => {
    return filteredInvoices.reduce((acc, invoice) => {
      acc.totalBruto += invoice.valorBruto;
      acc.totalRecebido += invoice.valorRecebido;
      acc.totalImpostos += invoice.irrf + invoice.csll + invoice.pis + invoice.cofins;
      return acc;
    }, { totalBruto: 0, totalRecebido: 0, totalImpostos: 0 });
  };

  const totals = calculateTotals();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToPDF = () => {
    // Simulação de exportação para PDF
    alert('Funcionalidade de exportação para PDF em desenvolvimento');
  };

  const exportToExcel = () => {
    // Simulação de exportação para Excel
    alert('Funcionalidade de exportação para Excel em desenvolvimento');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Relatórios</h2>
        <p className="text-gray-600">Análise financeira e exportação de dados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportToPDF} variant="outline">
                Exportar PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totals.totalBruto)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totals.totalRecebido)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Impostos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(totals.totalImpostos)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['pago', 'pendente', 'atrasado'].map(status => {
              const statusInvoices = filteredInvoices.filter(inv => inv.status === status);
              const statusTotal = statusInvoices.reduce((sum, inv) => sum + inv.valorBruto, 0);
              
              return (
                <div key={status} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{status}</span>
                    <span className="text-gray-500 ml-2">({statusInvoices.length} notas)</span>
                  </div>
                  <span className="font-bold">{formatCurrency(statusTotal)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Número</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Valor Bruto</th>
                  <th className="text-left p-2">Valor Recebido</th>
                  <th className="text-left p-2">Data Emissão</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="border-b">
                    <td className="p-2">{invoice.numero}</td>
                    <td className="p-2">{invoice.descricao}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'pago' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-2">{formatCurrency(invoice.valorBruto)}</td>
                    <td className="p-2">{formatCurrency(invoice.valorRecebido)}</td>
                    <td className="p-2">{new Date(invoice.dataEmissao).toLocaleDateString('pt-BR')}</td>
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
