import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useProposals, Proposal, ProposalStatus } from '@/hooks/useProposals';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface ProposalFormProps {
  onBack?: () => void;
  proposal?: Proposal | null;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ onBack, proposal }) => {
  const { clients } = useClients();
  const { projects } = useProjects();
  const { addProposal, updateProposal } = useProposals();
  const { toast } = useToast();
  const isEditing = !!proposal;

  const [clienteId, setClienteId] = useState(proposal?.clientId ?? '');
  const [projetoId, setProjetoId] = useState(proposal?.projectId ?? '');
  const [valor, setValor] = useState(proposal?.valor != null ? String(proposal.valor) : '');
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status ?? 'rascunho');
  const [docuSignId, setDocuSignId] = useState(proposal?.docuSignId ?? '');
  const [observacoes, setObservacoes] = useState(proposal?.observacoes ?? '');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setClienteId(proposal?.clientId ?? '');
    setProjetoId(proposal?.projectId ?? '');
    setValor(proposal?.valor != null ? String(proposal.valor) : '');
    setStatus(proposal?.status ?? 'rascunho');
    setDocuSignId(proposal?.docuSignId ?? '');
    setObservacoes(proposal?.observacoes ?? '');
    setArquivo(null);
  }, [proposal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      toast({ title: 'Atenção', description: 'Selecione um cliente para continuar.', variant: 'destructive' });
      return;
    }

    const numericValor = valor ? Number(valor) : null;
    let arquivoUrl: string | null | undefined = isEditing ? proposal!.arquivoUrl : null;

    if (arquivo) {
      setUploading(true);
      const nomeArquivo = `${Date.now()}_${arquivo.name
        .normalize('NFD')
        // eslint-disable-next-line no-misleading-character-class
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(nomeArquivo, arquivo, { contentType: 'application/pdf' });

      if (uploadError) {
        setUploading(false);
        toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('proposals')
        .getPublicUrl(uploadData.path);
      arquivoUrl = urlData.publicUrl;
      setUploading(false);
    }

    try {
      if (isEditing) {
        await updateProposal(proposal!.id, {
          clientId: clienteId,
          projectId: projetoId || null,
          valor: Number.isFinite(numericValor as number) ? (numericValor as number) : null,
          status,
          docuSignId: docuSignId || null,
          observacoes: observacoes || null,
          arquivoUrl: arquivoUrl ?? null,
        });
        toast({ title: 'Proposta atualizada!', description: 'As alterações foram salvas.' });
      } else {
        await addProposal({
          clientId: clienteId,
          projectId: projetoId || null,
          valor: Number.isFinite(numericValor as number) ? (numericValor as number) : null,
          status,
          docuSignId: docuSignId || null,
          observacoes: observacoes || null,
          arquivoUrl: arquivoUrl ?? null,
          id: '',
          created_at: undefined,
        });
        toast({ title: 'Proposta salva!', description: 'A proposta foi cadastrada com sucesso.' });
        setClienteId('');
        setProjetoId('');
        setValor('');
        setStatus('rascunho');
        setDocuSignId('');
        setObservacoes('');
        setArquivo(null);
      }
      if (onBack) onBack();
    } catch (error: unknown) {
      const message = (error as any)?.message ?? String(error);
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Proposta' : 'Nova Proposta'}
          </h2>
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
                value={projetoId ?? ''}
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
                  onChange={(e) => setStatus(e.target.value as ProposalStatus)}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo PDF {isEditing ? '(deixe em branco para manter o atual)' : '(opcional)'}
              </label>
              {isEditing && proposal?.arquivoUrl && !arquivo && (
                <p className="text-xs text-green-700 mb-1">
                  Arquivo atual:{' '}
                  <a href={proposal.arquivoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    ver PDF
                  </a>
                </p>
              )}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {arquivo && (
                <p className="text-xs text-gray-500 mt-1">Selecionado: {arquivo.name}</p>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                {uploading ? 'Enviando arquivo...' : isEditing ? 'Salvar Alterações' : 'Salvar Proposta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
