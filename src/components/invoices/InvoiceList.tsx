
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/hooks/useInvoices';
import { UpcomingInstallments } from './UpcomingInstallments';

interface InvoiceListProps {
  onEdit: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onEdit }) => {
  const { invoices, deleteInvoice, updateInvoice } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Estado local para data de recebimento e status por nota
  const [notaExtras, setNotaExtras] = useState<{ [id: string]: { dataRecebimento?: string; status?: 'pendente' | 'pago' | 'atrasado' } }>({});

  useEffect(() => {
    const saved = localStorage.getItem('rrz_nota_extras');
    if (saved) setNotaExtras(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('rrz_nota_extras', JSON.stringify(notaExtras));
  }, [notaExtras]);

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
    const matchesSearch = invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.tipo === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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

  const handleEdit = (invoice: Invoice) => {
    onEdit(invoice);
  };

  const handleDelete = (id: string) => {
    console.log('Excluindo nota fiscal:', id);
    deleteInvoice(id);
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
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
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
                          <input
                            type="date"
                            value={notaExtras[invoice.id]?.dataRecebimento || invoice.dataRecebimento || ''}
                            onChange={e => handleDataRecebimentoChange(invoice.id, e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <select
                            value={notaExtras[invoice.id]?.status || invoice.status}
                            onChange={e => handleStatusChange(invoice.id, e.target.value as 'pendente' | 'pago' | 'atrasado')}
                            className="border rounded px-2 py-1 w-full"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="atrasado">Atrasado</option>
                          </select>
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
                        onClick={() => handleDelete(invoice.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInvoices.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nenhuma nota fiscal encontrada.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parcelas" className="space-y-6">
          {invoicesWithFutureInstallments.length > 0 ? (
            <div className="space-y-6">
              {invoicesWithFutureInstallments.map((invoice) => (
                <div key={invoice.id}>
                  <UpcomingInstallments 
                    valorTotal={invoice.valorBruto}
                    valorLivreImpostos={invoice.valorLivreImpostos}
                    numeroParcela={invoice.numeroParcela || 1}
                    totalParcelas={invoice.totalParcelas || 1}
                    dataVencimento={invoice.dataVencimento}
                    clienteId={invoice.clienteId || ''}
                    numeroNota={invoice.numero}
                    dataEmissao={invoice.dataEmissao}
                    onEditNota={() => handleEdit(invoice)}
                  />
                </div>
              ))}
            </div>
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
          )}
        </TabsContent>
        <TabsContent value="parcelas-emitidas" className="space-y-6">
          {invoicesWithFutureInstallments.length > 0 ? (
            <div className="space-y-6">
              {invoicesWithFutureInstallments.map((invoice) => (
                <div key={invoice.id}>
                  <UpcomingInstallments 
                    valorTotal={invoice.valorBruto}
                    valorLivreImpostos={invoice.valorLivreImpostos}
                    numeroParcela={invoice.numeroParcela || 1}
                    totalParcelas={invoice.totalParcelas || 1}
                    dataVencimento={invoice.dataVencimento}
                    clienteId={invoice.clienteId || ''}
                    numeroNota={invoice.numero}
                    dataEmissao={invoice.dataEmissao}
                    onlyEmitted={true}
                  />
                </div>
              ))}
            </div>
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
