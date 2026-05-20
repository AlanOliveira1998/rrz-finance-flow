
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';

export const DashboardOverview = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pendentes');
  const notifiedRef = useRef<Set<string>>(new Set());

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
    { title: 'Total Recebido', value: totalReceived, color: 'text-green-600', bgColor: 'bg-green-50', icon: '💰' },
    { title: 'Pendente', value: totalPending, color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '⏳' },
    { title: 'Atrasado', value: totalOverdue, color: 'text-red-600', bgColor: 'bg-red-50', icon: '⚠️' },
    { title: 'Total de Notas', value: invoices.length, color: 'text-blue-600', bgColor: 'bg-blue-50', icon: '📄' },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (dataVencimento: string) => {
    if (!dataVencimento) return false;
    const venc = new Date(dataVencimento);
    const hoje = new Date();
    venc.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    return venc < hoje;
  };

  const daysUntil = (dataVencimento: string) => {
    const venc = new Date(dataVencimento);
    const hoje = new Date();
    venc.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Notas vencendo em até 7 dias ou já vencidas (status pendente)
  const alertas = invoices.filter((inv) => {
    if (inv.status !== 'pendente') return false;
    const diff = daysUntil(inv.dataVencimento);
    return diff <= 7;
  }).sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  // Toast para notas vencendo em até 3 dias — notifica apenas uma vez por sessão
  useEffect(() => {
    const hoje = new Date();
    invoices.forEach((invoice) => {
      if (invoice.status !== 'pendente') return;
      if (notifiedRef.current.has(invoice.id)) return;
      const vencimento = new Date(invoice.dataVencimento);
      const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 3) {
        notifiedRef.current.add(invoice.id);
        toast({
          title: 'Nota a vencer',
          description: `A nota ${invoice.numero} vence em ${Math.ceil(diff) === 0 ? 'hoje' : `${Math.ceil(diff)} dia(s)`}.`,
          variant: 'default',
        });
      }
    });
  }, [invoices, toast]);

  const notasPendentes = invoices.filter(invoice => invoice.status !== 'pago');
  const notasPagas = invoices.filter(invoice => invoice.status === 'pago');

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
                      : stat.value}
                  </p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Painel de alertas de vencimento */}
      {alertas.length > 0 && (
        <Card className="border-l-4 border-l-orange-400 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-700 text-base flex items-center gap-2">
              ⚠️ Alertas de Vencimento ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map((inv) => {
                const diff = daysUntil(inv.dataVencimento);
                const vencida = diff < 0;
                const hoje = diff === 0;
                return (
                  <div
                    key={inv.id}
                    className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                      vencida ? 'bg-red-100 text-red-800' : hoje ? 'bg-orange-100 text-orange-800' : 'bg-yellow-50 text-yellow-800'
                    }`}
                  >
                    <span>
                      <b>Nota {inv.numero}</b> — {inv.cliente}
                    </span>
                    <span className="font-semibold">
                      {vencida
                        ? `Vencida há ${Math.abs(diff)} dia(s)`
                        : hoje
                        ? 'Vence hoje'
                        : `Vence em ${diff} dia(s)`}{' '}
                      · {formatDate(inv.dataVencimento)} · {formatCurrency(inv.valorLivreImpostos)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controle de recebimento das notas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Controle de Recebimento das Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pendentes">Pendentes ({notasPendentes.length})</TabsTrigger>
              <TabsTrigger value="pagas">Pagas ({notasPagas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="mt-4">
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
                    {notasPendentes.map((invoice) => (
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
                          {invoice.status === 'pendente' && isOverdue(invoice.dataVencimento) && (
                            <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-bold bg-red-600 text-white animate-pulse" title="Nota vencida">
                              Vencida
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {notasPendentes.length === 0 && (
                  <div className="text-center py-8">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma nota pendente</h3>
                    <p className="mt-1 text-sm text-gray-500">Todas as notas foram pagas ou não há notas cadastradas.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pagas" className="mt-4">
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
                    {notasPagas.map((invoice) => (
                      <tr key={invoice.id} className="bg-green-50">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {notasPagas.length === 0 && (
                  <div className="text-center py-8">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma nota paga</h3>
                    <p className="mt-1 text-sm text-gray-500">Não há notas pagas para exibir.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
