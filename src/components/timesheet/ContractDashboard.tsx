import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHourBankContracts, TimesheetEntry, fromEntryDb } from '@/hooks/useHourBankContracts';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtH = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

interface MonthRow {
  ym: string;
  label: string;
  hoursUsed: number;
  cumulativeUsed: number;
  inClausePeriod: boolean;
  clauseAllowed: number;
  excessHours: number;
  excessAmount: number;
  totalBilling: number;
}

function buildMonthlyData(
  contract: { monthlyHours: number; monthlyFee: number; hourlyRate: number; startDate: string; hasCutClause: boolean; cutClauseMonths: number },
  entries: TimesheetEntry[]
): MonthRow[] {
  const byMonth: Record<string, number> = {};
  for (const e of entries) {
    const ym = e.endDate.slice(0, 7);
    byMonth[ym] = (byMonth[ym] ?? 0) + e.durationMinutes / 60;
  }

  const annualHours = contract.monthlyHours * 12;
  const startYM = contract.startDate.slice(0, 7);
  const nowYM = new Date().toISOString().slice(0, 7);

  const rows: MonthRow[] = [];
  let cursor = startYM;
  let monthIndex = 0;
  let cumUsed = 0;
  let prevClauseExcess = 0;
  let prevAnnualExcess = 0;

  while (cursor <= nowYM) {
    monthIndex++;
    const used = byMonth[cursor] ?? 0;
    cumUsed += used;

    const inClause = contract.hasCutClause && monthIndex <= contract.cutClauseMonths;
    const clauseAllowed = inClause ? contract.monthlyHours * monthIndex : annualHours;

    let excessHours = 0;
    if (inClause) {
      const cumExcess = Math.max(0, cumUsed - clauseAllowed);
      excessHours = Math.max(0, cumExcess - prevClauseExcess);
      prevClauseExcess = cumExcess;
    } else {
      const cumAnnualExcess = Math.max(0, cumUsed - annualHours);
      excessHours = Math.max(0, cumAnnualExcess - prevAnnualExcess);
      prevAnnualExcess = cumAnnualExcess;
    }

    const [y, m] = cursor.split('-').map(Number);
    const date = new Date(y, m - 1, 1);

    rows.push({
      ym: cursor,
      label: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
      hoursUsed: used,
      cumulativeUsed: cumUsed,
      inClausePeriod: inClause,
      clauseAllowed,
      excessHours,
      excessAmount: excessHours * contract.hourlyRate,
      totalBilling: contract.monthlyFee + excessHours * contract.hourlyRate,
    });

    const next = new Date(y, m, 1);
    cursor = next.toISOString().slice(0, 7);
  }

  return rows;
}

export const ContractDashboard: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { contracts } = useHourBankContracts();
  const { clients } = useClients();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const contract = contracts.find(c => c.id === contractId);
  const client = contract ? clients.find(cl => cl.id === contract.clientId) : null;

  useEffect(() => {
    if (!contractId) return;
    setLoading(true);
    supabase
      .from('timesheet_entries')
      .select('*')
      .eq('contract_id', contractId)
      .then(({ data }) => {
        if (data) setEntries(data.map(r => fromEntryDb(r as Record<string, unknown>)));
        setLoading(false);
      });
  }, [contractId]);

  const monthlyData = useMemo(() => {
    if (!contract) return [];
    return buildMonthlyData(contract, entries);
  }, [contract, entries]);

  const annualHours = contract ? contract.monthlyHours * 12 : 0;
  const totalUsed = monthlyData.reduce((s, r) => s + r.hoursUsed, 0);
  const totalExcessAmount = monthlyData.reduce((s, r) => s + r.excessAmount, 0);
  const annualProgress = annualHours > 0 ? Math.min(100, (totalUsed / annualHours) * 100) : 0;
  const annualRemaining = Math.max(0, annualHours - totalUsed);

  if (!contract) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Contrato não encontrado.{' '}
        <button onClick={() => navigate('/timesheet/contracts')} className="text-blue-600 hover:underline">
          Voltar para contratos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/timesheet/contracts')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Contratos
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {client?.razaoSocial || client?.nomeFantasia || '—'}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">{contract.projectName}</p>
          <p className="text-xs text-gray-400 mt-1">
            Início: {new Date(contract.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} ·{' '}
            {contract.monthlyHours}h/mês · {fmt(contract.monthlyFee)}/mês · Taxa {fmt(contract.hourlyRate)}/h
            {contract.hasCutClause && ` · Cláusula: ${contract.cutClauseMonths} meses`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/timesheet/import')}
          className="flex items-center gap-2"
        >
          <Upload size={15} /> Importar Horas
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando lançamentos...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">Nenhum lançamento importado ainda.</p>
          <Button onClick={() => navigate('/timesheet/import')} className="bg-blue-600 hover:bg-blue-700">
            <Upload size={15} className="mr-1.5" /> Importar horas do Operand
          </Button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Horas usadas (total)</p>
              <p className="text-xl font-bold text-gray-900">{totalUsed.toFixed(1)}h</p>
              <p className="text-xs text-gray-400">de {annualHours}h anuais</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Horas restantes</p>
              <p className={`text-xl font-bold ${annualRemaining <= 10 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {annualRemaining.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-400">no banco anual</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Excedente cobrado</p>
              <p className={`text-xl font-bold ${totalExcessAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {fmt(totalExcessAmount)}
              </p>
              <p className="text-xs text-gray-400">total acumulado</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Uso do banco anual</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all ${annualProgress >= 90 ? 'bg-red-500' : annualProgress >= 70 ? 'bg-orange-400' : 'bg-blue-500'}`}
                  style={{ width: `${annualProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{annualProgress.toFixed(0)}%</p>
            </div>
          </div>

          {/* Monthly table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Detalhamento Mensal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Mês</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Horas usadas</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Acumulado</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">
                      {contract.hasCutClause ? 'Permitido (cláusula)' : 'Banco anual'}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Excedente (h)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Excedente (R$)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total NF</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyData.map(row => (
                    <tr key={row.ym} className={row.excessHours > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800 capitalize">{row.label}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {row.hoursUsed > 0 ? row.hoursUsed.toFixed(2) + 'h' : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.cumulativeUsed.toFixed(2)}h</td>
                      <td className="px-4 py-3 text-right text-gray-500">{row.clauseAllowed.toFixed(0)}h</td>
                      <td className="px-4 py-3 text-right">
                        {row.excessHours > 0 ? (
                          <span className="font-semibold text-red-600">{row.excessHours.toFixed(2)}h</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.excessAmount > 0 ? (
                          <span className="font-semibold text-red-600">{fmt(row.excessAmount)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(row.totalBilling)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.inClausePeriod ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                            <AlertTriangle size={10} /> Cláusula
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            <CheckCircle2 size={10} /> Anual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-800" colSpan={5}>Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {fmt(totalExcessAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {fmt(monthlyData.reduce((s, r) => s + r.totalBilling, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
