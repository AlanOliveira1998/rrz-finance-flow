
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/components/ui/use-toast';

export const DashboardOverview = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<any[]>([]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    // Notificações automáticas para notas a vencer em até 3 dias
    const hoje = new Date();
    invoices.forEach((invoice) => {
      if (invoice.status === 'pendente') {
        const vencimento = new Date(invoice.dataVencimento);
        const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff <= 3) {
          updateInvoice && updateInvoice(invoice.id, {}); // força re-render para evitar toast duplicado
          toast({
            title: 'Nota a vencer',
            description: `A nota ${invoice.numero} vence em ${Math.ceil(diff)} dia(s).`,
            variant: 'default',
          });
        }
      }
    });
  }, [invoices, toast, updateInvoice]);

  React.useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem('rrz_logs') || '[]').reverse());
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Página Inicial</h2>
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

      {/* Controle de recebimento das notas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Controle de Recebimento das Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Nº</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Cliente</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Valor Líquido</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Emissão</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Vencimento</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Recebimento</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-2 py-1 whitespace-nowrap">{invoice.numero}</td>
                    <td className="px-2 py-1 whitespace-nowrap truncate max-w-[120px]">{invoice.cliente}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatCurrency(invoice.valorLivreImpostos)}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatDate(invoice.dataEmissao)}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatDate(invoice.dataVencimento)}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input
                        type="date"
                        value={invoice.dataRecebimento || ''}
                        onChange={e => updateInvoice(invoice.id, { dataRecebimento: e.target.value })}
                        className="border rounded px-1 py-0.5 w-28 text-xs"
                        style={{ minWidth: 0 }}
                      />
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={e => updateInvoice(invoice.id, { status: e.target.value as 'pendente' | 'pago' | 'atrasado' })}
                        className="border rounded px-1 py-0.5 w-24 text-xs"
                        style={{ minWidth: 0 }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                      </select>
                      {invoice.status === 'pendente' && new Date(invoice.dataVencimento) < new Date() && (
                        <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-bold bg-red-600 text-white animate-pulse" title="Nota vencida">
                          Vencida
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div className="text-center py-8">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma nota fiscal encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cadastre uma nota fiscal para começar o controle de recebimento.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controle de pagamento de boletos (contas a pagar) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Controle de Pagamento de Boletos (Contas a Pagar)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Nº</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Fornecedor</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Valor Líquido</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Emissão</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Vencimento</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Pagamento</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.filter(inv => inv.tipo === 'saida').map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-2 py-1 whitespace-nowrap">{invoice.numero}</td>
                    <td className="px-2 py-1 whitespace-nowrap truncate max-w-[120px]">{invoice.cliente}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatCurrency(invoice.valorLivreImpostos)}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatDate(invoice.dataEmissao)}</td>
                    <td className="px-2 py-1 whitespace-nowrap hidden md:table-cell">{formatDate(invoice.dataVencimento)}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input
                        type="date"
                        value={invoice.dataRecebimento || ''}
                        onChange={e => updateInvoice(invoice.id, { dataRecebimento: e.target.value })}
                        className="border rounded px-1 py-0.5 w-28 text-xs"
                        style={{ minWidth: 0 }}
                      />
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={e => updateInvoice(invoice.id, { status: e.target.value as 'pendente' | 'pago' | 'atrasado' })}
                        className="border rounded px-1 py-0.5 w-24 text-xs"
                        style={{ minWidth: 0 }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="atrasado">Atrasado</option>
                      </select>
                      {invoice.status === 'pendente' && new Date(invoice.dataVencimento) < new Date() && (
                        <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-bold bg-red-600 text-white animate-pulse" title="Boleto vencido">
                          Vencido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.filter(inv => inv.tipo === 'saida').length === 0 && (
              <div className="text-center py-8">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum boleto encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cadastre um boleto/conta a pagar para começar o controle de pagamentos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
