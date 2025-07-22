
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { Filter, X, FileText, FileSpreadsheet } from 'lucide-react';

export const Reports = () => {
  const { invoices } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();
  // Estados para os inputs do filtro
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] = useState('all');
  const [typeFilterInput, setTypeFilterInput] = useState('all');
  const [valorMinInput, setValorMinInput] = useState('');
  const [valorMaxInput, setValorMaxInput] = useState('');
  const [clienteFilterInput, setClienteFilterInput] = useState('all');
  const [projectFilterInput, setProjectFilterInput] = useState('all');
  const [tipoProjetoFilterInput, setTipoProjetoFilterInput] = useState('all');
  // Estados de filtro aplicados
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [clienteFilter, setClienteFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [tipoProjetoFilter, setTipoProjetoFilter] = useState('all');

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.dataEmissao);
    const matchesStartDate = startDate ? invoiceDate >= new Date(startDate) : true;
    const matchesEndDate = endDate ? invoiceDate <= new Date(endDate) : true;
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.tipo === typeFilter;
    const matchesValorMin = valorMin ? invoice.valorBruto >= parseFloat(valorMin) : true;
    const matchesValorMax = valorMax ? invoice.valorBruto <= parseFloat(valorMax) : true;
    const matchesCliente = clienteFilter === 'all' || invoice.clienteId === clienteFilter;
    const matchesProject = projectFilter === 'all' || invoice.projetoId === projectFilter;
    const matchesTipoProjeto = tipoProjetoFilter === 'all' || invoice.tipoProjeto === tipoProjetoFilter;

    return matchesStartDate && matchesEndDate && matchesStatus && matchesType && matchesValorMin && matchesValorMax && matchesCliente && matchesProject && matchesTipoProjeto;
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

  // Função para aplicar os filtros
  const applyFilters = () => {
    setStartDate(startDateInput);
    setEndDate(endDateInput);
    setStatusFilter(statusFilterInput);
    setTypeFilter(typeFilterInput);
    setValorMin(valorMinInput);
    setValorMax(valorMaxInput);
    setClienteFilter(clienteFilterInput);
    setProjectFilter(projectFilterInput);
    setTipoProjetoFilter(tipoProjetoFilterInput);
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setStartDateInput('');
    setEndDateInput('');
    setStatusFilterInput('all');
    setTypeFilterInput('all');
    setValorMinInput('');
    setValorMaxInput('');
    setClienteFilterInput('all');
    setProjectFilterInput('all');
    setTipoProjetoFilterInput('all');
    applyFilters();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Relatórios</h2>
        <p className="text-gray-600">Análise financeira e exportação de dados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={clearFilters} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={applyFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Campos de filtro aqui (inputs/selects) */}
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDateInput}
                onChange={e => setStartDateInput(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDateInput}
                onChange={e => setEndDateInput(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select className="w-full border rounded p-2" onChange={e => setStatusFilterInput(e.target.value)} value={statusFilterInput}>
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="w-full border rounded p-2" onChange={e => setTypeFilterInput(e.target.value)} value={typeFilterInput}>
                <option value="all">Todos os Tipos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <Label>Valor Mínimo</Label>
              <Input type="number" value={valorMinInput} onChange={e => setValorMinInput(e.target.value)} placeholder="Valor mínimo" />
            </div>
            <div>
              <Label>Valor Máximo</Label>
              <Input type="number" value={valorMaxInput} onChange={e => setValorMaxInput(e.target.value)} placeholder="Valor máximo" />
            </div>
            <div>
              <Label>Cliente</Label>
              <select className="w-full border rounded p-2" onChange={e => setClienteFilterInput(e.target.value)} value={clienteFilterInput}>
                <option value="all">Todos os Clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.razaoSocial}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Projeto</Label>
              <select className="w-full border rounded p-2" onChange={e => setProjectFilterInput(e.target.value)} value={projectFilterInput}>
                <option value="all">Todos os Projetos</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tipo de Projeto</Label>
              <select className="w-full border rounded p-2" onChange={e => setTipoProjetoFilterInput(e.target.value)} value={tipoProjetoFilterInput}>
                <option value="all">Todos os Tipos de Projeto</option>
                <option value="Escopo Fechado">Escopo Fechado</option>
                <option value="Assessoria Continua - Banco de Horas">Assessoria Continua - Banco de Horas</option>
                <option value="Assessoria Continua - Por Demanda">Assessoria Continua - Por Demanda</option>
                <option value="Processos e Controles">Processos e Controles</option>
                <option value="Offshore">Offshore</option>
                <option value="Não Financeiro">Não Financeiro</option>
              </select>
            </div>
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
