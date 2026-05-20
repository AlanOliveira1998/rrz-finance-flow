import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProposalsListProps {
  onEdit?: (proposal: Proposal) => void;
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviada',
  assinado: 'Assinada',
  rejeitado: 'Rejeitada',
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  enviado: 'bg-blue-100 text-blue-700',
  assinado: 'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-700',
};

export const ProposalsList: React.FC<ProposalsListProps> = ({ onEdit }) => {
  const navigate = useNavigate();
  const { proposals, loading, deleteProposal } = useProposals();
  const { clients } = useClients();
  const { projects } = useProjects();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getClientName = (id: string) =>
    clients.find((c) => c.id === id)?.razaoSocial || clients.find((c) => c.id === id)?.nomeFantasia || '—';

  const getProjectName = (id?: string | null) =>
    id ? projects.find((p) => p.id === id)?.nome || '—' : '—';

  const handleDelete = async () => {
    if (!proposalToDelete) return;
    setDeleting(true);
    try {
      await deleteProposal(proposalToDelete.id);
      toast({ title: 'Proposta excluída', description: 'A proposta foi excluída com sucesso.' });
    } catch {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a proposta.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setProposalToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Propostas</h2>
          <p className="text-gray-600">
            Controle das propostas enviadas para assinatura (ex.: DocuSign).
          </p>
        </div>
        {permissions.canCreate && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/dashboard/new-proposal')}>
            Nova Proposta
          </Button>
        )}
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
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Arquivo</th>
                  {(permissions.canEdit || permissions.canDelete) && (
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
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
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.docuSignId || '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {p.arquivoUrl ? (
                        <a
                          href={p.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Baixar PDF
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    {(permissions.canEdit || permissions.canDelete) && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex gap-2">
                          {permissions.canEdit && onEdit && (
                            <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                              Editar
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => setProposalToDelete(p)}
                            >
                              Excluir
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!proposalToDelete} onOpenChange={(open) => !open && setProposalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a proposta de{' '}
              <b>{proposalToDelete ? getClientName(proposalToDelete.clientId) : ''}</b>? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
