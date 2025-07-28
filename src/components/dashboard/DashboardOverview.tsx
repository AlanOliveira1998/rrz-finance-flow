
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const DashboardOverview = () => {
  const { invoices, updateInvoice } = useInvoices();
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

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

  // Função para verificar se uma nota está vencida
  const isInvoiceOverdue = (dataVencimento: string) => {
    if (!dataVencimento) return false;
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    // Resetar as horas para comparar apenas as datas
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento < hoje;
  };

  // Função para ordenar dados
  const sortData = (data: any[], key: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Tratamento especial para diferentes tipos de dados
      if (key === 'valorLivreImpostos') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (key === 'dataEmissao' || key === 'dataVencimento') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (key === 'numero') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Filtrar e ordenar notas por status
  const notasPendentes = sortConfig 
    ? sortData(invoices.filter(invoice => invoice.status !== 'pago'), sortConfig.key, sortConfig.direction)
    : invoices.filter(invoice => invoice.status !== 'pago');
  const notasPagas = sortConfig 
    ? sortData(invoices.filter(invoice => invoice.status === 'pago'), sortConfig.key, sortConfig.direction)
    : invoices.filter(invoice => invoice.status === 'pago');

  useEffect(() => {
    let isMounted = true;
    // Notificações automáticas para notas a vencer em até 3 dias
    const hoje = new Date();
    invoices.forEach((invoice) => {
      if (invoice.status === 'pendente') {
        const vencimento = new Date(invoice.dataVencimento);
        const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff <= 3) {
          if (isMounted) {
            updateInvoice && updateInvoice(invoice.id, {}); // força re-render para evitar toast duplicado
            toast({
              title: 'Nota a vencer',
              description: `A nota ${invoice.numero} vence em ${Math.ceil(diff)} dia(s).`,
              variant: 'default',
            });
          }
        }
      }
    });
    return () => { isMounted = false; };
  }, [invoices, toast, updateInvoice]);

  React.useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      setLogs(JSON.parse(localStorage.getItem('rrz_logs') || '[]').reverse());
    }
    return () => { isMounted = false; };
  }, [invoices]);

  // Forçar re-renderização quando os invoices mudarem
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pendentes">
                Pendentes ({notasPendentes.length})
              </TabsTrigger>
              <TabsTrigger value="pagas">
                Pagas ({notasPagas.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes" className="mt-4">
              <div className="overflow-x-auto" key={refreshKey}>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('numero')}
                      >
                        Nº {getSortIcon('numero')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('cliente')}
                      >
                        Cliente {getSortIcon('cliente')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('valorLivreImpostos')}
                      >
                        Valor Líquido {getSortIcon('valorLivreImpostos')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('dataEmissao')}
                      >
                        Emissão {getSortIcon('dataEmissao')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('dataVencimento')}
                      >
                        Vencimento {getSortIcon('dataVencimento')}
                      </th>
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
                          {invoice.status === 'pendente' && isInvoiceOverdue(invoice.dataVencimento) && (
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
                    <p className="mt-1 text-sm text-gray-500">
                      Todas as notas foram pagas ou não há notas cadastradas.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pagas" className="mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('numero')}
                      >
                        Nº {getSortIcon('numero')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('cliente')}
                      >
                        Cliente {getSortIcon('cliente')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('valorLivreImpostos')}
                      >
                        Valor Líquido {getSortIcon('valorLivreImpostos')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('dataEmissao')}
                      >
                        Emissão {getSortIcon('dataEmissao')}
                      </th>
                      <th 
                        className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                        onClick={() => handleSort('dataVencimento')}
                      >
                        Vencimento {getSortIcon('dataVencimento')}
                      </th>
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
                    <p className="mt-1 text-sm text-gray-500">
                      Não há notas pagas para exibir.
                    </p>
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
