import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { Invoice } from '@/hooks/useInvoices';

interface InvoiceListProps {
  onEdit: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onEdit }) => {
  const { invoices, deleteInvoice } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  console.log('InvoiceList renderizado. onEdit recebido:', typeof onEdit);

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
    console.log('=== INÍCIO HANDLE EDIT ===');
    console.log('Invoice recebida:', invoice);
    console.log('Tipo de onEdit:', typeof onEdit);
    console.log('onEdit existe?', !!onEdit);
    
    try {
      onEdit(invoice);
      console.log('onEdit executado com sucesso');
    } catch (error) {
      console.error('Erro ao executar onEdit:', error);
    }
    console.log('=== FIM HANDLE EDIT ===');
  };

  const handleDelete = (id: string) => {
    console.log('Excluindo nota fiscal:', id);
    deleteInvoice(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Notas Fiscais</h2>
        <p className="text-gray-600">Gerencie todas as suas notas fiscais</p>
      </div>

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
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      console.log('Botão Editar clicado para invoice:', invoice.numero);
                      e.preventDefault();
                      e.stopPropagation();
                      handleEdit(invoice);
                    }}
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
    </div>
  );
};
