import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInvoices } from '@/hooks/useInvoices';

interface UpcomingInstallmentsProps {
  valorTotal: number;
  numeroParcela: number;
  totalParcelas: number;
  dataVencimento: string;
  clienteId: string;
  numeroNota: string;
  dataEmissao: string;
  valorLivreImpostos: number; // Adicionar prop para valor líquido
  onlyEmitted?: boolean; // nova prop
  onEditNota?: () => void;
}

interface InstallmentExtra {
  emitida: boolean;
  dataPagamento?: string;
  status?: 'pendente' | 'pago' | 'atrasado';
  valorEditado?: number;
}

// Função utilitária para checar se é feriado nacional fixo
const isFixedHoliday = (date: Date) => {
  const mmdd = (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
  const fixedHolidays = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência
    '10-12', // N. Sra. Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '12-25', // Natal
  ];
  return fixedHolidays.includes(mmdd);
};

// Função para avançar para o próximo dia útil
const getNextBusinessDay = (date: Date) => {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6 || isFixedHoliday(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

export const UpcomingInstallments: React.FC<UpcomingInstallmentsProps> = ({
  valorTotal,
  numeroParcela,
  totalParcelas,
  dataVencimento,
  clienteId,
  numeroNota,
  dataEmissao,
  valorLivreImpostos,
  onlyEmitted = false,
  onEditNota
}) => {
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const cliente = clients.find(c => c.id === clienteId);

  // Estado de parcelas emitidas e extras
  const [extras, setExtras] = useState<{ [key: string]: InstallmentExtra }>({});

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rrz_emitted_installments');
    if (saved) setExtras(JSON.parse(saved));
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('rrz_emitted_installments', JSON.stringify(extras));
  }, [extras]);

  const handleToggleEmit = (key: string) => {
    setExtras(prev => ({ ...prev, [key]: { ...prev[key], emitida: !prev[key]?.emitida } }));
  };

  const handleDateChange = (key: string, value: string) => {
    setExtras(prev => ({ ...prev, [key]: { ...prev[key], dataPagamento: value } }));
  };

  const handleStatusChange = (key: string, value: 'pendente' | 'pago' | 'atrasado') => {
    setExtras(prev => ({ ...prev, [key]: { ...prev[key], status: value } }));
  };

  const handleValueChange = (key: string, value: number) => {
    setExtras(prev => ({ ...prev, [key]: { ...prev[key], valorEditado: value } }));
  };

  // Valor líquido por parcela (agora: repetir o valor líquido total em cada parcela)
  const valorLiquidoPorParcela = valorLivreImpostos || valorTotal;

  const generateUpcomingInstallments = () => {
    const installments = [];
    // Buscar a nota matriz (parcela 1) para garantir a data de emissão correta
    let dataEmissaoBase = dataEmissao;
    if (invoices && numeroNota) {
      // Se houver uma parcela emitida, use a data de emissão dela como base
      const ultimaEmitida = invoices.find(inv => inv.numero === numeroNota && inv.numeroParcela === numeroParcela);
      if (ultimaEmitida && ultimaEmitida.dataEmissao) {
        dataEmissaoBase = ultimaEmitida.dataEmissao;
      } else {
        // Se não, use a data de emissão da matriz
        const matriz = invoices.find(inv => inv.numero === numeroNota && (inv.numeroParcela === 1 || !inv.numeroParcela));
        if (matriz && matriz.dataEmissao) {
          dataEmissaoBase = matriz.dataEmissao;
        }
      }
    }
    let dataEmissaoAnterior = new Date(dataEmissaoBase);
    for (let i = numeroParcela + 1; i <= totalParcelas; i++) {
      // Data de emissão da próxima parcela = data de emissão anterior + 1 mês
      let dataEmissaoParcela = new Date(dataEmissaoAnterior);
      dataEmissaoParcela.setMonth(dataEmissaoParcela.getMonth() + 1);
      dataEmissaoParcela = getNextBusinessDay(dataEmissaoParcela);
      const dueDate = new Date(dataVencimento);
      dueDate.setMonth(dueDate.getMonth() + (i - numeroParcela));
      const key = `${numeroNota}-${i}`;
      installments.push({
        numero: i,
        dataVencimento: dueDate.toISOString().split('T')[0],
        valor: extras[key]?.valorEditado ?? valorLiquidoPorParcela,
        mes: dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        mesNumerico: dueDate.getMonth() + 1,
        cliente: cliente?.razaoSocial || 'Cliente não encontrado',
        numeroNota,
        dataEmissao: dataEmissaoParcela.toISOString().split('T')[0],
        key,
        emitida: !!extras[key]?.emitida,
        dataPagamento: extras[key]?.dataPagamento || '',
        status: extras[key]?.status || 'pendente',
      });
      // Atualizar dataEmissaoAnterior para a próxima parcela
      dataEmissaoAnterior = new Date(dataEmissaoParcela);
    }
    return installments;
  };

  const upcomingInstallments = generateUpcomingInstallments();

  // Filtrar parcelas
  const filteredInstallments = upcomingInstallments.filter(installment => {
    const matchesSearch = (installment.cliente?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (installment.numeroNota?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesMonth = monthFilter === 'all' || installment.mesNumerico.toString() === monthFilter;
    const matchesEmit = onlyEmitted ? installment.emitida : !installment.emitida;
    return matchesSearch && matchesMonth && matchesEmit;
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

  // Resumo usando o valor correto por parcela
  const totalFilteredValue = filteredInstallments.length * valorLiquidoPorParcela;

  if (totalParcelas <= 1 || numeroParcela >= totalParcelas) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Buscar por cliente ou número da nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mês" />
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
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{onlyEmitted ? 'Parcelas Emitidas' : 'Próximas Parcelas a Emitir'}</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredInstallments.length} parcela{filteredInstallments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInstallments.length > 0 ? (
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
                  <TableRow key={`${installment.numeroNota}-${installment.numero}`}>
                    <TableCell>{installment.mes}</TableCell>
                    <TableCell>{installment.cliente}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(installment.valor)}
                    </TableCell>
                    <TableCell>{formatDate(installment.dataEmissao)}</TableCell>
                    <TableCell>
                      {installment.numero}/{totalParcelas}
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={!!extras[installment.key]?.emitida}
                        onChange={() => handleToggleEmit(installment.key)}
                      />
                    </TableCell>
                    {/* Remover Data Pagamento e Status da aba de emitidas */}
                    <TableCell>
                      {onEditNota && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onEditNota}
                        >
                          Editar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma parcela encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros para ver mais resultados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {filteredInstallments.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Resumo das Parcelas Filtradas</h4>
                <p className="text-sm text-blue-700">
                  {filteredInstallments.length} de {upcomingInstallments.length} parcelas
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Valor total das parcelas filtradas</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(totalFilteredValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
