import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useProposals } from '@/hooks/useProposals';

interface ProposalFormProps {
  onBack?: () => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ onBack }) => {
  const { clients } = useClients();
  const { projects } = useProjects();
  const { addProposal } = useProposals();

  const [clienteId, setClienteId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'rascunho' | 'enviado' | 'assinado' | 'rejeitado'>('rascunho');
  const [docuSignId, setDocuSignId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      alert('Selecione um cliente para continuar.');
      return;
    }

    const numericValor = valor ? Number(valor) : null;

    try {
      await addProposal({
        clientId: clienteId,
        projectId: projetoId || null,
        valor: Number.isFinite(numericValor as number) ? (numericValor as number) : null,
        status,
        docuSignId: docuSignId || null,
        observacoes: observacoes || null,
        id: '', // não usado na inserção
        created_at: undefined,
      });
      alert('Proposta salva com sucesso!');
      if (onBack) {
        onBack();
      } else {
        setClienteId('');
        setProjetoId('');
        setValor('');
        setStatus('rascunho');
        setDocuSignId('');
        setObservacoes('');
      }
    } catch (error: unknown) {
      const message = (error as any)?.message ?? String(error);
      alert(`Erro ao salvar proposta: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Nova Proposta</h2>
          <p className="text-gray-600">
            Registre aqui as propostas que você envia para assinatura (ex.: DocuSign).
          </p>
        </div>
        {onBack && (
          <Button variant="outline" type="button" onClick={onBack}>
            Voltar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Proposta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-white"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razaoSocial || c.nomeFantasia || c.cnpj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projeto contratado</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-white"
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
              >
                <option value="">Selecione um projeto (opcional)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="R$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviada</option>
                  <option value="assinado">Assinada</option>
                  <option value="rejeitado">Rejeitada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID DocuSign (opcional)</label>
                <Input
                  value={docuSignId}
                  onChange={(e) => setDocuSignId(e.target.value)}
                  placeholder="Envelope ID / link de controle"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre a proposta, prazos, condições etc."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Salvar Proposta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

