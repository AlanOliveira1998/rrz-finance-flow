import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { useHourBankContracts, HourBankContract } from '@/hooks/useHourBankContracts';
import { useToast } from '@/hooks/use-toast';

interface ContractFormProps {
  onBack: () => void;
  contract?: HourBankContract | null;
}

export const ContractForm: React.FC<ContractFormProps> = ({ onBack, contract }) => {
  const { clients } = useClients();
  const { addContract, updateContract } = useHourBankContracts();
  const { toast } = useToast();
  const isEditing = !!contract;

  const [clientId, setClientId] = useState(contract?.clientId ?? '');
  const [projectName, setProjectName] = useState(contract?.projectName ?? '');
  const [startDate, setStartDate] = useState(contract?.startDate ?? '');
  const [monthlyHours, setMonthlyHours] = useState(contract?.monthlyHours != null ? String(contract.monthlyHours) : '');
  const [monthlyFee, setMonthlyFee] = useState(contract?.monthlyFee != null ? String(contract.monthlyFee) : '');
  const [hourlyRate, setHourlyRate] = useState(contract?.hourlyRate != null ? String(contract.hourlyRate) : '');
  const [hasCutClause, setHasCutClause] = useState(contract?.hasCutClause ?? false);
  const [cutClauseMonths, setCutClauseMonths] = useState(contract?.cutClauseMonths != null ? String(contract.cutClauseMonths) : '6');
  const [status, setStatus] = useState<'ativo' | 'encerrado'>(contract?.status ?? 'ativo');

  useEffect(() => {
    setClientId(contract?.clientId ?? '');
    setProjectName(contract?.projectName ?? '');
    setStartDate(contract?.startDate ?? '');
    setMonthlyHours(contract?.monthlyHours != null ? String(contract.monthlyHours) : '');
    setMonthlyFee(contract?.monthlyFee != null ? String(contract.monthlyFee) : '');
    setHourlyRate(contract?.hourlyRate != null ? String(contract.hourlyRate) : '');
    setHasCutClause(contract?.hasCutClause ?? false);
    setCutClauseMonths(contract?.cutClauseMonths != null ? String(contract.cutClauseMonths) : '6');
    setStatus(contract?.status ?? 'ativo');
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast({ title: 'Atenção', description: 'Selecione um cliente.', variant: 'destructive' });
      return;
    }
    const data = {
      clientId,
      projectName,
      startDate,
      monthlyHours: Number(monthlyHours),
      monthlyFee: Number(monthlyFee),
      hourlyRate: Number(hourlyRate),
      hasCutClause,
      cutClauseMonths: Number(cutClauseMonths),
      status,
    };
    try {
      if (isEditing) {
        await updateContract(contract!.id, data);
        toast({ title: 'Contrato atualizado!' });
      } else {
        await addContract(data);
        toast({ title: 'Contrato cadastrado!' });
      }
      onBack();
    } catch (error: unknown) {
      toast({ title: 'Erro ao salvar', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Banco de horas — Assessoria Contínua</p>
        </div>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Contrato</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.razaoSocial || c.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Projeto * <span className="text-xs text-gray-400">(igual ao Operand)</span>
                </label>
                <Input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Ex: Assessoria Contínua - 2026"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas/mês contratadas *</label>
                <Input
                  type="number" min="0" step="0.5"
                  value={monthlyHours}
                  onChange={e => setMonthlyHours(e.target.value)}
                  placeholder="Ex: 10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'ativo' | 'encerrado')}
                >
                  <option value="ativo">Ativo</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor mensal (R$) *</label>
                <Input
                  type="number" min="0" step="0.01"
                  value={monthlyFee}
                  onChange={e => setMonthlyFee(e.target.value)}
                  placeholder="Ex: 8000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa horária excedente (R$/h) *</label>
                <Input
                  type="number" min="0" step="0.01"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  placeholder="Ex: 800"
                  required
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasCutClause"
                  checked={hasCutClause}
                  onChange={e => setHasCutClause(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="hasCutClause" className="text-sm font-medium text-gray-700">
                  Possui cláusula de corte
                </label>
              </div>
              {hasCutClause && (
                <div className="w-56">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração da cláusula (meses)
                  </label>
                  <Input
                    type="number" min="1" max="12"
                    value={cutClauseMonths}
                    onChange={e => setCutClauseMonths(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Excedente proporcional será cobrado nos primeiros {cutClauseMonths} meses.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onBack}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Contrato'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
