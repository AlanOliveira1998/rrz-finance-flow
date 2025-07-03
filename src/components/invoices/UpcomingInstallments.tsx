
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/useClients';
import { Calendar, DollarSign, FileText } from 'lucide-react';

interface UpcomingInstallmentsProps {
  valorTotal: number;
  numeroParcela: number;
  totalParcelas: number;
  dataVencimento: string;
  clienteId: string;
}

export const UpcomingInstallments: React.FC<UpcomingInstallmentsProps> = ({
  valorTotal,
  numeroParcela,
  totalParcelas,
  dataVencimento,
  clienteId
}) => {
  const { clients } = useClients();
  
  const cliente = clients.find(c => c.id === clienteId);
  
  // Corrigindo o cálculo: valor de cada parcela é o valor total dividido pelo número total de parcelas
  const valorPorParcela = valorTotal / totalParcelas;

  const generateUpcomingInstallments = () => {
    const installments = [];
    const baseDate = new Date(dataVencimento);
    
    // Gerar parcelas futuras (da próxima até a última)
    for (let i = numeroParcela + 1; i <= totalParcelas; i++) {
      const dueDate = new Date(baseDate);
      // Adicionar meses baseado na diferença entre a parcela atual e a futura
      dueDate.setMonth(dueDate.getMonth() + (i - numeroParcela));
      
      installments.push({
        numero: i,
        dataVencimento: dueDate.toISOString().split('T')[0],
        valor: valorPorParcela, // Usar o valor correto por parcela
        mes: dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }
    
    return installments;
  };

  const upcomingInstallments = generateUpcomingInstallments();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (totalParcelas <= 1 || numeroParcela >= totalParcelas) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma parcela futura</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta nota não possui parcelas futuras para exibir.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Próximas Parcelas a Emitir</h3>
          <p className="text-sm text-gray-600">
            {cliente && `Cliente: ${cliente.razaoSocial}`}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {upcomingInstallments.length} parcela{upcomingInstallments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingInstallments.map((installment) => (
          <Card key={installment.numero} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Parcela {installment.numero}/{totalParcelas}
                </CardTitle>
                <Badge variant="secondary">
                  Pendente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {formatDate(installment.dataVencimento)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(installment.valor)}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Vencimento em {installment.mes}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Resumo das Parcelas</h4>
              <p className="text-sm text-blue-700">
                Total de {totalParcelas} parcelas • Atual: {numeroParcela}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Valor total restante</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(upcomingInstallments.length * valorPorParcela)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
