import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHourBankContracts } from '@/hooks/useHourBankContracts';
import { useClients } from '@/hooks/useClients';
import { ScrollText, Upload, ChevronRight, Timer } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const TimesheetHome = () => {
  const navigate = useNavigate();
  const { contracts } = useHourBankContracts();
  const { clients } = useClients();

  const ativos = contracts.filter(c => c.status === 'ativo');

  const atalhos = [
    {
      label: 'Contratos',
      desc: 'Gerenciar bancos de horas',
      path: '/timesheet/contracts',
      color: 'border-blue-200 hover:border-blue-400',
      icon: <ScrollText size={18} className="text-blue-500" />,
    },
    {
      label: 'Importar Horas',
      desc: 'Upload do relatório Operand',
      path: '/timesheet/import',
      color: 'border-green-200 hover:border-green-400',
      icon: <Upload size={18} className="text-green-500" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Banco de Horas</h2>
        <p className="text-gray-500 text-sm mt-0.5">Controle de assessoria contínua</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-700 mb-3">
            <Timer size={20} />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Contratos Ativos</p>
          <p className="text-2xl font-bold text-blue-700">{ativos.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 mb-3">
            <ScrollText size={20} />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Receita Mensal (contratos)</p>
          <p className="text-2xl font-bold text-emerald-700">
            {fmt(ativos.reduce((s, c) => s + c.monthlyFee, 0))}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 mb-3">
            <Timer size={20} />
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Total Horas/mês Contratadas</p>
          <p className="text-2xl font-bold text-gray-700">
            {ativos.reduce((s, c) => s + c.monthlyHours, 0).toFixed(0)}h
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contratos ativos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Contratos Ativos</h3>
            <button onClick={() => navigate('/timesheet/contracts')} className="text-xs text-blue-600 hover:underline">
              ver todos
            </button>
          </div>
          {ativos.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Nenhum contrato ativo.{' '}
              <button onClick={() => navigate('/timesheet/contracts/new')} className="text-blue-600 hover:underline">
                Cadastrar contrato
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {ativos.slice(0, 6).map(c => {
                const client = clients.find(cl => cl.id === c.clientId);
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/timesheet/dashboard/${c.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {client?.razaoSocial || client?.nomeFantasia || '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{c.projectName}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-xs text-gray-500">{c.monthlyHours}h/mês</span>
                      {c.hasCutClause && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                          Cláusula
                        </span>
                      )}
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Acesso rápido */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm px-1">Acesso Rápido</h3>
          <div className="grid grid-cols-1 gap-3">
            {atalhos.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={`bg-white border-2 ${a.color} rounded-xl p-4 text-left transition hover:shadow-sm flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  {a.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
