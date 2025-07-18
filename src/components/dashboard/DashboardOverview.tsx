
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';

export const DashboardOverview = () => {
  const { invoices } = useInvoices();

  const totalReceived = invoices
    .filter(inv => inv.status === 'pago')
    .reduce((sum, inv) => sum + (inv.valorLivreImpostos || 0), 0);

  const totalPending = invoices
    .filter(inv => inv.status === 'pendente')
    .reduce((sum, inv) => sum + (inv.valorLivreImpostos || 0), 0);

  const totalOverdue = invoices
    .filter(inv => inv.status === 'atrasado')
    .reduce((sum, inv) => sum + (inv.valorLivreImpostos || 0), 0);

  const stats = [
    {
      title: 'Total Recebido',
      value: totalReceived,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '💰'
    },
    {
      title: 'Pendente',
      value: totalPending,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: '⏳'
    },
    {
      title: 'Atrasado',
      value: totalOverdue,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: '⚠️'
    },
    {
      title: 'Total de Notas',
      value: invoices.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '📄'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Visão geral dos lançamentos financeiros</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.bgColor} border-0`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {typeof stat.value === 'number' && stat.title !== 'Total de Notas' 
                      ? formatCurrency(stat.value)
                      : stat.value
                    }
                  </p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notas Fiscais Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.numero}</p>
                    <p className="text-sm text-gray-600">{invoice.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.valorLivreImpostos || 0)}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      invoice.status === 'pago' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pagas</span>
                <span className="text-sm text-green-600">
                  {invoices.filter(inv => inv.status === 'pago').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pendentes</span>
                <span className="text-sm text-yellow-600">
                  {invoices.filter(inv => inv.status === 'pendente').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Atrasadas</span>
                <span className="text-sm text-red-600">
                  {invoices.filter(inv => inv.status === 'atrasado').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
