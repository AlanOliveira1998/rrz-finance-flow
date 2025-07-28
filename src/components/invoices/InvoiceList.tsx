
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/hooks/useInvoices';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Download } from 'lucide-react';

interface InvoiceListProps {
  onEdit: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onEdit }) => {
  const { invoices, deleteInvoice, updateInvoice, loading } = useInvoices();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estado local para data de recebimento e status por nota
  const [notaExtras, setNotaExtras] = useState<{ [id: string]: { dataRecebimento?: string; status?: 'pendente' | 'pago' | 'atrasado' } }>({});

  const { projects } = useProjects();
  const { clients } = useClients();
  const [projectFilter, setProjectFilter] = useState('all');
  const [tipoProjetoFilter, setTipoProjetoFilter] = useState('all');
  const [clienteFilter, setClienteFilter] = useState('all');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dataEmissaoInicio, setDataEmissaoInicio] = useState('');
  const [dataEmissaoFim, setDataEmissaoFim] = useState('');
  const [dataVencimentoInicio, setDataVencimentoInicio] = useState('');
  const [dataVencimentoFim, setDataVencimentoFim] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('rrz_nota_extras');
    if (saved) setNotaExtras(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('rrz_nota_extras', JSON.stringify(notaExtras));
  }, [notaExtras]);

  useEffect(() => {
    // Notificações automáticas para notas a vencer em até 3 dias
    const hoje = new Date();
    invoices.forEach((invoice) => {
      if (invoice.status === 'pendente') {
        const vencimento = new Date(invoice.dataVencimento);
        const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff <= 3) {
          toast({
            title: 'Nota a vencer',
            description: `A nota ${invoice.numero} vence em ${Math.ceil(diff)} dia(s).`,
            variant: 'default',
          });
        }
      }
    });
  }, [invoices, toast]);

  const handleDataRecebimentoChange = (id: string, value: string) => {
    setNotaExtras(prev => ({ ...prev, [id]: { ...prev[id], dataRecebimento: value } }));
    // Atualizar no contexto de notas
    updateInvoice(id, { dataRecebimento: value });
  };

  const handleStatusChange = (id: string, value: 'pendente' | 'pago' | 'atrasado') => {
    setNotaExtras(prev => ({ ...prev, [id]: { ...prev[id], status: value } }));
    updateInvoice(id, { status: value });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = (invoice.numero?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (invoice.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (invoice.cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.tipo === typeFilter;
    const matchesProject = projectFilter === 'all' || invoice.projetoId === projectFilter;
    const matchesTipoProjeto = tipoProjetoFilter === 'all' || invoice.tipoProjeto === tipoProjetoFilter;
    const matchesCliente = clienteFilter === 'all' || invoice.clienteId === clienteFilter;
    const matchesValorMin = !valorMin || invoice.valorBruto >= parseFloat(valorMin);
    const matchesValorMax = !valorMax || invoice.valorBruto <= parseFloat(valorMax);
    const matchesDataEmissaoInicio = !dataEmissaoInicio || new Date(invoice.dataEmissao) >= new Date(dataEmissaoInicio);
    const matchesDataEmissaoFim = !dataEmissaoFim || new Date(invoice.dataEmissao) <= new Date(dataEmissaoFim);
    const matchesDataVencimentoInicio = !dataVencimentoInicio || new Date(invoice.dataVencimento) >= new Date(dataVencimentoInicio);
    const matchesDataVencimentoFim = !dataVencimentoFim || new Date(invoice.dataVencimento) <= new Date(dataVencimentoFim);
    return matchesSearch && matchesStatus && matchesType && matchesProject && matchesTipoProjeto && matchesCliente && matchesValorMin && matchesValorMax && matchesDataEmissaoInicio && matchesDataEmissaoFim && matchesDataVencimentoInicio && matchesDataVencimentoFim;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para gerar todas as próximas parcelas de todas as notas
  const generateAllUpcomingInstallments = (onlyEmitted: boolean = false) => {
    const allInstallments: any[] = [];
    
    invoicesWithFutureInstallments.forEach((invoice) => {
      const cliente = clients.find(c => c.id === invoice.clienteId);
      const valorLiquidoPorParcela = invoice.valorLivreImpostos || invoice.valorBruto;
      const numeroParcela = invoice.numeroParcela || 1;
      const totalParcelas = invoice.totalParcelas || 1;
      
      // Carregar extras do localStorage
      const saved = localStorage.getItem('rrz_emitted_installments');
      const extras = saved ? JSON.parse(saved) : {};
      
      // Gerar parcelas futuras para esta nota
      let dataEmissaoBase = invoice.dataEmissao;
      let dataEmissaoAnterior = new Date(dataEmissaoBase);
      
      for (let i = numeroParcela + 1; i <= totalParcelas; i++) {
        // Data de emissão da próxima parcela = data de emissão anterior + 1 mês
        let dataEmissaoParcela = new Date(dataEmissaoAnterior);
        dataEmissaoParcela.setMonth(dataEmissaoParcela.getMonth() + 1);
        
        // Função para avançar para o próximo dia útil
        const getNextBusinessDay = (date: Date) => {
          const d = new Date(date);
          while (d.getDay() === 0 || d.getDay() === 6) {
            d.setDate(d.getDate() + 1);
          }
          return d;
        };
        
        dataEmissaoParcela = getNextBusinessDay(dataEmissaoParcela);
        
        const dueDate = new Date(invoice.dataVencimento);
        dueDate.setMonth(dueDate.getMonth() + (i - numeroParcela));
        
        const key = `${invoice.numero}-${i}`;
        const emitida = !!extras[key]?.emitida;
        
        // Filtrar por status de emissão
        if (onlyEmitted === emitida) {
          allInstallments.push({
            numero: i,
            dataVencimento: dueDate.toISOString().split('T')[0],
            valor: extras[key]?.valorEditado ?? valorLiquidoPorParcela,
            mes: dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            cliente: cliente?.razaoSocial || 'Cliente não encontrado',
            numeroNota: invoice.numero,
            dataEmissao: dataEmissaoParcela.toISOString().split('T')[0],
            key,
            emitida,
            totalParcelas,
            invoiceId: invoice.id,
            tipoProjeto: invoice.tipoProjeto || '',
          });
        }
        
        // Atualizar dataEmissaoAnterior para a próxima parcela
        dataEmissaoAnterior = new Date(dataEmissaoParcela);
      }
    });
    
    // Ordenar por data de vencimento
    return allInstallments.sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
  };

  // Função para exportar para Excel
  const exportToExcel = (installments: any[], monthFilter: string) => {
    // Criar o conteúdo CSV
    const headers = [
      'Mês',
      'Cliente',
      'Valor da Parcela',
      'Data de Emissão',
      'Parcela',
      'Número da Nota',
      'Tipo de Projeto'
    ];

    const csvContent = [
      headers.join(','),
      ...installments.map(installment => [
        installment.mes,
        `"${installment.cliente}"`, // Aspas para evitar problemas com vírgulas no nome
        installment.valor.toFixed(2).replace('.', ','),
        installment.dataEmissao,
        `${installment.numero}/${installment.totalParcelas}`,
        installment.numeroNota,
        installment.tipoProjeto || ''
      ].join(','))
    ].join('\n');

    // Criar o blob e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Nome do arquivo com mês atual
    const currentDate = new Date();
    const monthName = monthFilter === 'all' 
      ? 'Todas_Parcelas' 
      : new Date(currentDate.getFullYear(), parseInt(monthFilter) - 1).toLocaleDateString('pt-BR', { month: 'long' });
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Parcelas_${monthName}_${currentDate.getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (invoice: Invoice) => {
    onEdit(invoice);
  };

  const handleDelete = async (id: string, numero: string) => {
    setLoadingDelete(true);
    try {
      await deleteInvoice(id);
      toast({
        title: 'Nota fiscal excluída',
        description: `Nota ${numero} foi excluída com sucesso.`,
        variant: 'default',
      });
    } catch (e) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a nota fiscal.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDelete(false);
      setInvoiceToDelete(null);
    }
  };

  // Pegar todas as notas com parcelas futuras para a aba de próximas parcelas
  const invoicesWithFutureInstallments = invoices.filter(invoice => 
    invoice.totalParcelas && invoice.numeroParcela && 
    invoice.totalParcelas > 1 && invoice.numeroParcela < invoice.totalParcelas
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Notas Fiscais</h2>
        <p className="text-gray-600">Gerencie todas as suas notas fiscais</p>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Lista de Notas</TabsTrigger>
          <TabsTrigger value="parcelas">Próximas Parcelas</TabsTrigger>
          <TabsTrigger value="parcelas-emitidas">Parcelas Emitidas</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Buscar por número, descrição ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Projetos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tipoProjetoFilter} onValueChange={setTipoProjetoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos de Projeto</SelectItem>
                    <SelectItem value="Escopo Fechado">Escopo Fechado</SelectItem>
                    <SelectItem value="Assessoria Continua - Banco de Horas">Assessoria Continua - Banco de Horas</SelectItem>
                    <SelectItem value="Assessoria Continua - Por Demanda">Assessoria Continua - Por Demanda</SelectItem>
                    <SelectItem value="Processos e Controles">Processos e Controles</SelectItem>
                    <SelectItem value="Offshore">Offshore</SelectItem>
                    <SelectItem value="Não Financeiro">Não Financeiro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={clienteFilter} onValueChange={setClienteFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="Valor mínimo"
                  value={valorMin}
                  onChange={e => setValorMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Valor máximo"
                  value={valorMax}
                  onChange={e => setValorMax(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Emissão início"
                    value={dataEmissaoInicio}
                    onChange={e => setDataEmissaoInicio(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Emissão fim"
                    value={dataEmissaoFim}
                    onChange={e => setDataEmissaoFim(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Vencimento início"
                    value={dataVencimentoInicio}
                    onChange={e => setDataVencimentoInicio(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Vencimento fim"
                    value={dataVencimentoFim}
                    onChange={e => setDataVencimentoFim(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Nenhuma nota fiscal encontrada.</p>
                </CardContent>
              </Card>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold">{invoice.numero}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'pago' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                          {invoice.status === 'pendente' && new Date(invoice.dataVencimento) < new Date() && (
                            <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-bold bg-red-600 text-white animate-pulse" title="Nota vencida">
                              Vencida
                            </span>
                          )}
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            invoice.tipo === 'entrada' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {invoice.tipo.charAt(0).toUpperCase() + invoice.tipo.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{invoice.descricao}</p>
                        {invoice.cliente && (
                          <p className="text-sm text-gray-500 mb-2">Cliente: {invoice.cliente}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Valor Bruto:</span>
                            <p className="font-medium">{formatCurrency(invoice.valorBruto)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor Recebido:</span>
                            <p className="font-medium">{formatCurrency(invoice.valorRecebido)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Emissão:</span>
                            <p className="font-medium">{formatDate(invoice.dataEmissao)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Vencimento:</span>
                            <p className="font-medium">{formatDate(invoice.dataVencimento)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Recebimento:</span>
                            <p className="font-medium">{invoice.dataRecebimento ? formatDate(invoice.dataRecebimento) : '-'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setInvoiceToDelete(invoice)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Modal de confirmação de exclusão de nota fiscal */}
          <AlertDialog open={!!invoiceToDelete} onOpenChange={open => { if (!open) setInvoiceToDelete(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a nota fiscal <b>{invoiceToDelete?.numero}</b>? Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loadingDelete}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => invoiceToDelete && handleDelete(invoiceToDelete.id, invoiceToDelete.numero)}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="parcelas" className="space-y-6">
          {(() => {
            const allInstallments = generateAllUpcomingInstallments(false);
            const [monthFilter, setMonthFilter] = useState('all');
            
            // Filtrar por mês se necessário
            const filteredInstallments = monthFilter === 'all' 
              ? allInstallments 
              : allInstallments.filter(installment => {
                  const installmentDate = new Date(installment.dataVencimento);
                  return (installmentDate.getMonth() + 1).toString() === monthFilter;
                });
            
            return allInstallments.length > 0 ? (
              <>
                {/* Filtro por mês */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label htmlFor="month-filter" className="text-sm font-medium">
                            Filtrar por mês:
                          </label>
                          <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os meses</SelectItem>
                              <SelectItem value="1">Janeiro</SelectItem>
                              <SelectItem value="2">Fevereiro</SelectItem>
                              <SelectItem value="3">Março</SelectItem>
                              <SelectItem value="4">Abril</SelectItem>
                              <SelectItem value="5">Maio</SelectItem>
                              <SelectItem value="6">Junho</SelectItem>
                              <SelectItem value="7">Julho</SelectItem>
                              <SelectItem value="8">Agosto</SelectItem>
                              <SelectItem value="9">Setembro</SelectItem>
                              <SelectItem value="10">Outubro</SelectItem>
                              <SelectItem value="11">Novembro</SelectItem>
                              <SelectItem value="12">Dezembro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {filteredInstallments.length} de {allInstallments.length} parcelas
                        </Badge>
                      </div>
                      <Button
                        onClick={() => exportToExcel(filteredInstallments, monthFilter)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={filteredInstallments.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        Exportar Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Próximas Parcelas a Emitir</CardTitle>
                      <Badge variant="outline" className="text-sm">
                        {filteredInstallments.length} parcela{filteredInstallments.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Valor da Parcela</TableHead>
                          <TableHead>Data de Emissão</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Emitida?</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInstallments.map((installment) => (
                          <TableRow key={installment.key}>
                            <TableCell>{installment.mes}</TableCell>
                            <TableCell>{installment.cliente}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(installment.valor)}
                            </TableCell>
                            <TableCell>{formatDate(installment.dataEmissao)}</TableCell>
                            <TableCell>
                              {installment.numero}/{installment.totalParcelas}
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={installment.emitida}
                                onChange={() => {
                                  const saved = localStorage.getItem('rrz_emitted_installments');
                                  const extras = saved ? JSON.parse(saved) : {};
                                  extras[installment.key] = { ...extras[installment.key], emitida: !installment.emitida };
                                  localStorage.setItem('rrz_emitted_installments', JSON.stringify(extras));
                                  // Forçar re-render
                                  window.location.reload();
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const invoice = invoices.find(inv => inv.id === installment.invoiceId);
                                  if (invoice) handleEdit(invoice);
                                }}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {/* Resumo */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Resumo das Parcelas</h4>
                        <p className="text-sm text-blue-700">
                          {filteredInstallments.length} de {allInstallments.length} parcelas a emitir
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700">Valor total das parcelas filtradas</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(filteredInstallments.reduce((sum, installment) => sum + installment.valor, 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-center">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma parcela futura</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Não há notas fiscais com parcelas futuras para exibir.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
        <TabsContent value="parcelas-emitidas" className="space-y-6">
          {(() => {
            const allEmittedInstallments = generateAllUpcomingInstallments(true);
            return allEmittedInstallments.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Parcelas Emitidas</CardTitle>
                      <Badge variant="outline" className="text-sm">
                        {allEmittedInstallments.length} parcela{allEmittedInstallments.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Valor da Parcela</TableHead>
                          <TableHead>Data de Emissão</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Emitida?</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allEmittedInstallments.map((installment) => (
                          <TableRow key={installment.key}>
                            <TableCell>{installment.mes}</TableCell>
                            <TableCell>{installment.cliente}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(installment.valor)}
                            </TableCell>
                            <TableCell>{formatDate(installment.dataEmissao)}</TableCell>
                            <TableCell>
                              {installment.numero}/{installment.totalParcelas}
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={installment.emitida}
                                onChange={() => {
                                  const saved = localStorage.getItem('rrz_emitted_installments');
                                  const extras = saved ? JSON.parse(saved) : {};
                                  extras[installment.key] = { ...extras[installment.key], emitida: !installment.emitida };
                                  localStorage.setItem('rrz_emitted_installments', JSON.stringify(extras));
                                  // Forçar re-render
                                  window.location.reload();
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const invoice = invoices.find(inv => inv.id === installment.invoiceId);
                                  if (invoice) handleEdit(invoice);
                                }}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {/* Resumo */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">Resumo das Parcelas Emitidas</h4>
                        <p className="text-sm text-green-700">
                          {allEmittedInstallments.length} parcelas emitidas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-700">Valor total das parcelas</p>
                        <p className="text-lg font-bold text-green-900">
                          {formatCurrency(allEmittedInstallments.reduce((sum, installment) => sum + installment.valor, 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-center">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma parcela emitida</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Não há parcelas emitidas para exibir.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
