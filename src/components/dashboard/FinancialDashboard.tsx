import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { useProposals } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

// Returns "YYYY-MM" for a given month offset from today
const yearMonth = (offsetMonths = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().slice(0, 7);
};

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviada',
  assinado: 'Assinada',
  rejeitado: 'Rejeitada',
};

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded shadow p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const FinancialDashboard: React.FC = () => {
  const { invoices } = useInvoices();
  const { proposals } = useProposals();
  const { clients } = useClients();
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('pay_bills').select('*').then(({ data }) => setBills(data || []));
  }, []);

  const currentYM = yearMonth(0);
  const currentYear = currentYM.slice(0, 4);

  // Notas de entrada (receita) — exclui notas de saída/despesa
  const notasEntrada = useMemo(
    () => invoices.filter(inv => !inv.tipo || inv.tipo === 'entrada'),
    [invoices],
  );

  // ─── KPI: Receita do mês atual — valor líquido (bruto – impostos) ─────────────
  const receitaMes = useMemo(() =>
    notasEntrada
      .filter(inv => (inv.dataEmissao || '').slice(0, 7) === currentYM)
      .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0),
    [notasEntrada, currentYM]);

  // ─── KPI: A receber — valor líquido das notas pendentes ─────────────────────
  const aReceber = useMemo(() =>
    notasEntrada
      .filter(inv => inv.status === 'pendente')
      .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0),
    [notasEntrada]);

  // ─── KPI: Despesas do mês (contas a pagar com vencimento neste mês) ──────────
  const despesasMes = useMemo(() =>
    bills
      .filter(b => (b.data_vencimento || '').slice(0, 7) === currentYM)
      .reduce((s, b) => s + Number(b.valor || 0), 0),
    [bills, currentYM]);

  // ─── KPI: Resultado do mês ───────────────────────────────────────────────────
  const resultadoMes = receitaMes - despesasMes;

  // ─── KPI: Inadimplência — valor líquido em atraso / total a receber ──────────
  const hoje = new Date().toISOString().slice(0, 10);
  const { totalEmAberto, totalAtrasado } = useMemo(() => {
    const emAberto = notasEntrada.filter(inv => inv.status !== 'pago');
    const atrasado = emAberto.filter(
      inv => inv.status === 'atrasado' || (inv.status === 'pendente' && inv.dataVencimento < hoje)
    );
    return {
      totalEmAberto: emAberto.reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0),
      totalAtrasado: atrasado.reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0),
    };
  }, [notasEntrada, hoje]);
  const taxaInadimplencia = totalEmAberto > 0 ? (totalAtrasado / totalEmAberto) * 100 : 0;

  // ─── KPI: Propostas em negociação ───────────────────────────────────────────
  const propostasAbertas = useMemo(() => {
    const ativas = proposals.filter(p => p.status === 'enviado');
    return {
      count: ativas.length,
      valor: ativas.reduce((s, p) => s + (p.valor || 0), 0),
    };
  }, [proposals]);

  // ─── KPI: Ticket médio — valor líquido médio por nota (ano atual) ───────────
  const ticketMedio = useMemo(() => {
    const desteAno = notasEntrada.filter(inv => (inv.dataEmissao || '').startsWith(currentYear));
    const count = desteAno.length;
    const total = desteAno.reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0);
    return count > 0 ? total / count : 0;
  }, [notasEntrada, currentYear]);

  // ─── Gráfico: Receita vs Despesas (últimos 6 meses) ─────────────────────────
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ym = yearMonth(i - 5);
      const [y, m] = ym.split('-');
      const label = `${MONTH_LABELS[m]}/${y.slice(2)}`;
      const receita = notasEntrada
        .filter(inv => (inv.dataEmissao || '').slice(0, 7) === ym)
        .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0);
      const despesa = bills
        .filter(b => (b.data_vencimento || '').slice(0, 7) === ym)
        .reduce((s, b) => s + Number(b.valor || 0), 0);
      return { mes: label, Receita: receita, Despesas: despesa, Resultado: receita - despesa };
    });
  }, [notasEntrada, bills]);

  // ─── Gráfico: Faturamento mês a mês (ano atual) ─────────────────────────────
  const faturamentoMensal = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const ym = `${currentYear}-${m}`;
      const faturamento = notasEntrada
        .filter(inv => (inv.dataEmissao || '').slice(0, 7) === ym)
        .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0);
      return { mes: MONTH_LABELS[m], Faturamento: faturamento };
    });
  }, [notasEntrada, currentYear]);

  const faturamentoMedia = faturamentoMensal.reduce((s, d) => s + d.Faturamento, 0) / 12;

  // ─── Gráfico: Projeção de faturamento ────────────────────────────────────────
  // Mostra o realizado (notas já emitidas) + projetado (parcelas futuras dos contratos ativos)
  // Janela: jan do ano atual até 12 meses à frente
  const projecaoFaturamento = useMemo(() => {
    const hojeDate = new Date();
    const hojeYM  = hojeDate.toISOString().slice(0, 7);

    // Agrupa notas de entrada pelo número da nota para identificar parcelas emitidas
    const byNumero: Record<string, typeof notasEntrada> = {};
    notasEntrada.forEach(inv => {
      const key = inv.numero;
      if (!byNumero[key]) byNumero[key] = [];
      byNumero[key].push(inv);
    });

    // Para cada contrato com parcelas futuras, calcula a projeção por mês
    const projMap: Record<string, number> = {};
    Object.values(byNumero).forEach(grupo => {
      const total = grupo[0].totalParcelas || 1;
      if (total <= 1) return;

      const maxEmitida = Math.max(...grupo.map(inv => inv.numeroParcela || 1));
      if (maxEmitida >= total) return; // todas as parcelas já foram emitidas

      // Usa a última parcela emitida como base para projetar as próximas datas
      const base = grupo.find(inv => (inv.numeroParcela || 1) === maxEmitida) || grupo[0];
      const baseVenc = new Date((base.dataVencimento || hojeDate.toISOString().slice(0, 10)) + 'T12:00:00');
      const valorPorParcela = base.valorLivreImpostos || 0;

      for (let i = maxEmitida + 1; i <= total; i++) {
        const proj = new Date(baseVenc);
        proj.setMonth(proj.getMonth() + (i - maxEmitida));
        const ym = proj.toISOString().slice(0, 7);
        projMap[ym] = (projMap[ym] || 0) + valorPorParcela;
      }
    });

    // Monta os pontos: 3 meses anteriores + mês atual + 11 meses futuros = 15 meses
    return Array.from({ length: 15 }, (_, i) => {
      const ym = yearMonth(i - 3);
      const [y, m] = ym.split('-');
      const label = `${MONTH_LABELS[m]}/${y.slice(2)}`;
      const isPast = ym <= hojeYM;

      const realizado = notasEntrada
        .filter(inv => (inv.dataEmissao || '').slice(0, 7) === ym)
        .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0);

      const projetado = !isPast ? (projMap[ym] || 0) : 0;

      return { mes: label, ym, Realizado: isPast ? realizado : 0, Projetado: projetado };
    });
  }, [notasEntrada]);

  const totalProjetado = projecaoFaturamento.reduce((s, d) => s + d.Projetado, 0);

  // ─── Gráfico: Propostas por status (pizza) ───────────────────────────────────
  const proposalsPieData = useMemo(() => {
    const map: Record<string, { count: number; valor: number }> = {};
    proposals.forEach(p => {
      if (!map[p.status]) map[p.status] = { count: 0, valor: 0 };
      map[p.status].count++;
      map[p.status].valor += p.valor || 0;
    });
    return Object.entries(map).map(([status, d]) => ({
      name: PROPOSAL_STATUS_LABEL[status] ?? status,
      value: d.count,
      valor: d.valor,
    }));
  }, [proposals]);

  // ─── Tabela: Top 5 clientes por receita (ano atual) ──────────────────────────
  const topClientes = useMemo(() => {
    const map: Record<string, number> = {};
    notasEntrada
      .filter(inv => (inv.dataEmissao || '').startsWith(currentYear))
      .forEach(inv => {
        const nome = inv.cliente || 'Sem cliente';
        map[nome] = (map[nome] || 0) + (inv.valorLivreImpostos || 0);
      });
    return Object.entries(map)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [notasEntrada, currentYear]);

  // ─── Tabela: Próximos vencimentos (30 dias) ───────────────────────────────────
  const proximosVencimentos = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    const limiteStr = limite.toISOString().slice(0, 10);

    const fromInvoices = notasEntrada
      .filter(inv => inv.status === 'pendente' && inv.dataVencimento >= hoje && inv.dataVencimento <= limiteStr)
      .map(inv => ({
        tipo: 'receber' as const,
        descricao: `Nota ${inv.numero}`,
        detalhe: inv.cliente,
        valor: inv.valorLivreImpostos,
        data: inv.dataVencimento,
      }));

    const fromBills = bills
      .filter(b => b.status === 'pendente' && b.data_vencimento >= hoje && b.data_vencimento <= limiteStr)
      .map(b => ({
        tipo: 'pagar' as const,
        descricao: b.categoria || 'Conta a pagar',
        detalhe: '',
        valor: Number(b.valor),
        data: b.data_vencimento,
      }));

    return [...fromInvoices, ...fromBills]
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 10);
  }, [notasEntrada, bills, hoje]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h2>
        <p className="text-gray-500 text-sm mt-1">
          Mês atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── KPIs principais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-0">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Receita do Mês</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{fmt(receitaMes)}</p>
            <p className="text-xs text-green-600 mt-1">Valor líquido das notas emitidas</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-0">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">A Receber</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{fmt(aReceber)}</p>
            <p className="text-xs text-yellow-600 mt-1">Notas pendentes</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Despesas do Mês</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{fmt(despesasMes)}</p>
            <p className="text-xs text-red-600 mt-1">Contas a pagar vencendo</p>
          </CardContent>
        </Card>
        <Card className={`border-0 ${resultadoMes >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <CardContent className="p-5">
            <p className={`text-xs font-medium uppercase tracking-wide ${resultadoMes >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              Resultado do Mês
            </p>
            <p className={`text-2xl font-bold mt-1 ${resultadoMes >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {fmt(resultadoMes)}
            </p>
            <p className={`text-xs mt-1 ${resultadoMes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {resultadoMes >= 0 ? 'Receita – Despesas' : 'Atenção: despesas maiores'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── KPIs secundários ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-3xl">📋</div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Propostas Abertas</p>
              <p className="text-xl font-bold text-gray-800">{propostasAbertas.count} proposta{propostasAbertas.count !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500">{fmt(propostasAbertas.valor)} em negociação</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inadimplência</p>
              <p className={`text-xl font-bold ${taxaInadimplencia > 20 ? 'text-red-600' : taxaInadimplencia > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                {taxaInadimplencia.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">{fmt(totalAtrasado)} em atraso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-3xl">📈</div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ticket Médio ({currentYear})</p>
              <p className="text-xl font-bold text-gray-800">{fmt(ticketMedio)}</p>
              <p className="text-xs text-gray-500">
                {notasEntrada.filter(inv => (inv.dataEmissao || '').startsWith(currentYear)).length} notas emitidas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Faturamento mensal ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Faturamento Mensal — {currentYear}</CardTitle>
            <span className="text-xs text-gray-500">
              Média: <span className="font-semibold text-gray-700">{fmt(faturamentoMedia)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={faturamentoMensal} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={42} />
              <Tooltip
                formatter={(v: any) => [fmt(v), 'Faturamento']}
                cursor={{ fill: '#f0fdf4' }}
              />
              <Bar dataKey="Faturamento" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {faturamentoMensal.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === new Date().getMonth() ? '#16a34a' : '#86efac'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Projeção de faturamento ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Projeção de Faturamento</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Barras verdes = realizado · Barras azuis = parcelas futuras já contratadas
              </p>
            </div>
            {totalProjetado > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">
                Projetado: <span className="font-semibold">{fmt(totalProjetado)}</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totalProjetado === 0 && projecaoFaturamento.every(d => d.Realizado === 0) ? (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
              Nenhum dado disponível. Cadastre notas parceladas para ver a projeção.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={projecaoFaturamento} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={40} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={42} />
                <Tooltip
                  formatter={(v: any, name: string) => [fmt(v), name]}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Realizado" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Projetado" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de barras: Receita vs Despesas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Receita vs Despesas — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receita" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="Resultado" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de pizza: Propostas por status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Propostas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {proposalsPieData.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                Nenhuma proposta
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={proposalsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {proposalsPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string, props: any) => [`${value} · ${fmt(props.payload.valor)}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {proposalsPieData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {item.name}
                      </span>
                      <span className="text-gray-500">{item.value} · {fmt(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabelas inferiores ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Clientes por Receita ({currentYear})</CardTitle>
          </CardHeader>
          <CardContent>
            {topClientes.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
            ) : (
              <div className="space-y-3">
                {topClientes.map((c, i) => {
                  const maxVal = topClientes[0].total;
                  const pct = maxVal > 0 ? (c.total / maxVal) * 100 : 0;
                  return (
                    <div key={c.nome}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 truncate max-w-[60%]">
                          {i + 1}. {c.nome}
                        </span>
                        <span className="text-gray-600 font-semibold">{fmt(c.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos vencimentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vencimentos nos Próximos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            {proximosVencimentos.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum vencimento próximo.</p>
            ) : (
              <div className="overflow-y-auto max-h-[220px] space-y-2">
                {proximosVencimentos.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                      item.tipo === 'receber' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.tipo === 'receber' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {item.tipo === 'receber' ? 'A receber' : 'A pagar'}
                      </span>
                      <span className="truncate text-gray-700">
                        {item.descricao}{item.detalhe ? ` · ${item.detalhe}` : ''}
                      </span>
                    </div>
                    <div className="text-right whitespace-nowrap ml-2">
                      <p className="font-semibold text-gray-800">{fmt(item.valor)}</p>
                      <p className="text-xs text-gray-500">{fmtDate(item.data)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
