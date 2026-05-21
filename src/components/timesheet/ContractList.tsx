import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHourBankContracts, HourBankContract } from '@/hooks/useHourBankContracts';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, BarChart2, Pencil, Trash2 } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface ContractListProps {
  onEdit: (contract: HourBankContract) => void;
}

export const ContractList: React.FC<ContractListProps> = ({ onEdit }) => {
  const navigate = useNavigate();
  const { contracts, deleteContract, loading } = useHourBankContracts();
  const { clients } = useClients();
  const { toast } = useToast();

  const handleDelete = async (c: HourBankContract) => {
    const client = clients.find(cl => cl.id === c.clientId);
    const name = client?.razaoSocial || client?.nomeFantasia || 'este contrato';
    if (!window.confirm(`Excluir contrato de "${name}"? Todos os lançamentos serão removidos.`)) return;
    try {
      await deleteContract(c.id);
      toast({ title: 'Contrato excluído.' });
    } catch (error: unknown) {
      toast({ title: 'Erro ao excluir', description: (error as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contratos de Banco de Horas</h2>
          <p className="text-gray-500 text-sm mt-0.5">Assessoria Contínua — controle de horas mensais</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/timesheet/contracts/new')}>
          <Plus size={16} className="mr-1.5" /> Novo Contrato
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum contrato cadastrado.{' '}
          <button onClick={() => navigate('/timesheet/contracts/new')} className="text-blue-600 hover:underline">
            Cadastrar agora
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Projeto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Início</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">h/mês</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Valor mensal</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Taxa/h</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Cláusula</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map(c => {
                  const client = clients.find(cl => cl.id === c.clientId);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {client?.razaoSocial || client?.nomeFantasia || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{c.projectName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(c.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{c.monthlyHours}h</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(c.monthlyFee)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(c.hourlyRate)}</td>
                      <td className="px-4 py-3 text-center">
                        {c.hasCutClause ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            {c.cutClauseMonths} meses
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          c.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            title="Ver painel"
                            onClick={() => navigate(`/timesheet/dashboard/${c.id}`)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                          >
                            <BarChart2 size={15} />
                          </button>
                          <button
                            title="Editar"
                            onClick={() => onEdit(c)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            title="Excluir"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
