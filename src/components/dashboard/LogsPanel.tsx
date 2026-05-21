import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ActivityLog {
  id: string;
  timestamp: string;
  user_name?: string;
  entity_type?: string;
  action_type?: string;
  entity_name?: string;
  entity_id?: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
}

const ENTITY_LABELS: Record<string, string> = {
  cliente: 'Cliente',
  nota: 'Nota Fiscal',
  projeto: 'Projeto',
  proposta: 'Proposta',
  fornecedor: 'Fornecedor',
  boleto: 'Boleto',
}

const LogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data as ActivityLog[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Histórico de Alterações</h2>
      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Data/Hora</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Usuário</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Tipo</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Ação</th>
                <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Nenhuma alteração registrada.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{log.user_name}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{log.entity_type ? (ENTITY_LABELS[log.entity_type] ?? log.entity_type) : ''}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{log.action_type ? (ACTION_LABELS[log.action_type] ?? log.action_type) : ''}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{log.entity_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogsPanel;
