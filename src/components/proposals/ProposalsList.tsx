import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProposals } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';

export const ProposalsList: React.FC = () => {
  const navigate = useNavigate();
  const { proposals, loading } = useProposals();
  const { clients } = useClients();
  const { projects } = useProjects();

  const getClientName = (id: string) =>
    clients.find((c) => c.id === id)?.razaoSocial || clients.find((c) => c.id === id)?.nomeFantasia || '—';

  const getProjectName = (id?: string | null) =>
    id ? projects.find((p) => p.id === id)?.nome || '—' : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Propostas</h2>
          <p className="text-gray-600">
            Controle das propostas enviadas para assinatura (ex.: DocuSign).
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/dashboard/new-proposal')}>
          Nova Proposta
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-500">Carregando propostas...</p>
        ) : proposals.length === 0 ? (
          <p className="text-gray-500">Nenhuma proposta cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Cliente</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Projeto</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Valor</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">DocuSign ID</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{getClientName(p.clientId)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{getProjectName(p.projectId)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {p.valor != null
                        ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">{p.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.docuSignId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

