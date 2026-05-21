import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { useProposals } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, CreditCard, FileText, TrendingDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface PayBill {
  id: string;
  data_vencimento: string;
  data_pagamento?: string;
  valor: number;
  status: string;
  categoria?: string;
  fornecedor_id?: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

const daysFromToday = (dateStr: string) => {
  const today = new Date();
  const date = new Date(dateStr + 'T12:00:00');
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

export const HomeOverview = () => {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const { proposals } = useProposals();
  const { clients } = useClients();
  const [payBills, setPayBills] = useState<PayBill[]>([]);

  useEffect(() => {
    supabase.from('pay_bills').select('*').then(({ data }) => {
      if (data) setPayBills(data as PayBill[]);
    });
  }, []);

  const currentYM = new Date().toISOString().slice(0, 7);

  const receitaMes = useMemo(() =>
    invoices
      .filter(inv => (!inv.tipo || inv.tipo === 'entrada') && (inv.dataVencimento || '').slice(0, 7) === currentYM && inv.status === 'pago')
      .reduce((s, inv) => s + (inv.valorLivreImpostos || 0), 0),
    [invoices, currentYM]
  );

  const aPagarMes = useMemo(() =>
    payBills
      .filter(b => (b.data_vencimento || '').slice(0, 7) === currentYM && b.status !== 'pago')
      .reduce((s, b) => s + (Number(b.valor) || 0), 0),
    [payBills, currentYM]
  );

  const propostasAbertas = useMemo(() =>
    proposals.filter(p => p.status === 'rascunho' || p.status === 'enviado'),
    [proposals]
  );

  const resultado = receitaMes - aPagarMes;

  // Próximos vencimentos (7 dias) — receber + pagar
  const proximosVencimentos = useMemo(() => {
    const items: { id: string; tipo: 'receber' | 'pagar'; descricao: string; valor: number; data: string; diff: number }[] = [];

    invoices
      .filter(inv => (!inv.tipo || inv.tipo === 'entrada') && inv.status !== 'pago')
      .forEach(inv => {
        const diff = daysFromToday(inv.dataVencimento);
        if (diff <= 7) {
          const client = clients.find(c => c.id === inv.clienteId || c.razaoSocial === inv.cliente);
          items.push({
            id: inv.id,
            tipo: 'receber',
            descricao: inv.cliente || client?.razaoSocial || `Nota ${inv.numero}`,
            valor: inv.valorLivreImpostos || 0,
            data: inv.dataVencimento,
            diff,
          });
        }
      });

    payBills
      .filter(b => b.status !== 'pago')
      .forEach(b => {
        const diff = daysFromToday(b.data_vencimento);
        if (diff <= 7) {
          items.push({
            id: b.id,
            tipo: 'pagar',
            descricao: b.categoria || 'Boleto',
            valor: Number(b.valor) || 0,
            data: b.data_vencimento,
            diff,
          });
        }
      });

    return items.sort((a, b) => a.diff - b.diff);
  }, [invoices, payBills, clients]);

  const kpis = [
    {
      label: 'Receita do Mês',
      value: fmt(receitaMes),
      icon: <TrendingUp size={20} />,
      bg: 'bg-green-50',
      color: 'text-green-700',
      iconBg: 'bg-green-100',
      onClick: () => navigate('/dashboard/financeiro'),
    },
    {
      label: 'A Pagar no Mês',
      value: fmt(aPagarMes),
      icon: <CreditCard size={20} />,
      bg: 'bg-red-50',
      color: 'text-red-700',
      iconBg: 'bg-red-100',
      onClick: () => navigate('/dashboard/pagar'),
    },
    {
      label: 'Propostas Abertas',
      value: String(propostasAbertas.length),
      icon: <FileText size={20} />,
      bg: 'bg-blue-50',
      color: 'text-blue-700',
      iconBg: 'bg-blue-100',
      onClick: () => navigate('/dashboard/proposals'),
    },
    {
      label: 'Resultado do Mês',
      value: fmt(resultado),
      icon: <TrendingDown size={20} />,
      bg: resultado >= 0 ? 'bg-emerald-50' : 'bg-orange-50',
      color: resultado >= 0 ? 'text-emerald-700' : 'text-orange-700',
      iconBg: resultado >= 0 ? 'bg-emerald-100' : 'bg-orange-100',
      onClick: () => navigate('/dashboard/financeiro'),
    },
  ];

  const atalhos = [
    { label: 'Contas a Receber', desc: 'Controle de notas fiscais', path: '/dashboard/receber', color: 'border-green-200 hover:border-green-400' },
    { label: 'Contas a Pagar', desc: 'Boletos e fornecedores', path: '/dashboard/pagar', color: 'border-red-200 hover:border-red-400' },
    { label: 'Notas Fiscais', desc: 'Cadastro e lançamentos', path: '/dashboard/invoices', color: 'border-blue-200 hover:border-blue-400' },
    { label: 'Propostas', desc: 'Contratos para assinatura', path: '/dashboard/proposals', color: 'border-purple-200 hover:border-purple-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        <p className="text-gray-500 text-sm mt-0.5">Resumo do mês de {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <button
            key={kpi.label}
            onClick={kpi.onClick}
            className={`${kpi.bg} rounded-xl p-5 text-left transition hover:shadow-md hover:scale-[1.01]`}
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${kpi.iconBg} ${kpi.color} mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos vencimentos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Próximos Vencimentos (7 dias)</h3>
            </div>
            <span className="text-xs text-gray-400">{proximosVencimentos.length} item(s)</span>
          </div>
          {proximosVencimentos.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Nenhum vencimento nos próximos 7 dias.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {proximosVencimentos.slice(0, 8).map(item => (
                <li key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      item.tipo === 'receber' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.tipo === 'receber' ? 'Receber' : 'Pagar'}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{item.descricao}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{fmt(item.valor)}</p>
                    <p className={`text-xs ${item.diff < 0 ? 'text-red-500 font-medium' : item.diff === 0 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                      {item.diff < 0 ? `Vencido há ${Math.abs(item.diff)}d` : item.diff === 0 ? 'Vence hoje' : fmtDate(item.data)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Atalhos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm px-1">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {atalhos.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={`bg-white border-2 ${a.color} rounded-xl p-4 text-left transition hover:shadow-sm flex items-center justify-between group`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Propostas abertas resumo */}
          {propostasAbertas.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-blue-800 mb-2">Propostas aguardando resposta</p>
              <ul className="space-y-1">
                {propostasAbertas.slice(0, 3).map(p => {
                  const client = clients.find(c => c.id === p.clientId);
                  return (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 truncate">{client?.razaoSocial || client?.nomeFantasia || '—'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ml-2 flex-shrink-0 ${
                        p.status === 'enviado' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {p.status === 'enviado' ? 'Enviada' : 'Rascunho'}
                      </span>
                    </li>
                  );
                })}
                {propostasAbertas.length > 3 && (
                  <li className="text-xs text-blue-500 text-right">+{propostasAbertas.length - 3} mais</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
