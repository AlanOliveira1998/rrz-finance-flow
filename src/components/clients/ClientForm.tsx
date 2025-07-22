
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

function isCNPJ(value: string) {
  return value.replace(/\D/g, '').length === 14;
}

function isCPF(value: string) {
  return value.replace(/\D/g, '').length === 11;
}

export const ClientForm = () => {
  const { addClient } = useClients();
  const [doc, setDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    cnpj: '',
    cpf: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    ativo: true,
  });
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoc(e.target.value);
    setError(null);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleAutoFill = async () => {
    setAutoFillLoading(true);
    setError(null);
    const cleanDoc = doc.replace(/\D/g, '');
    if (isCNPJ(cleanDoc)) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`);
        if (!res.ok) {
          setError('CNPJ não encontrado na BrasilAPI. Preencha manualmente.');
          setAutoFillLoading(false);
          return;
        }
        const data = await res.json();
        setFields({
          ...fields,
          cnpj: cleanDoc,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          email: (data.qsa && data.qsa[0]?.nome) || '', // BrasilAPI não retorna email, mas pode retornar sócio
          telefone: data.telefone || '',
          endereco: data.descricao_tipo_de_logradouro && data.logradouro ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}` : '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          ativo: data.situacao_cadastral === 'ATIVA',
        });
      } catch (err) {
        setError('Erro ao buscar dados do CNPJ. Preencha manualmente.');
      }
    } else {
      setError('Digite um CNPJ válido para busca automática.');
    }
    setAutoFillLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isCnpjDoc = isCNPJ(doc);
      const payload = {
        cnpj: isCnpjDoc ? doc.replace(/\D/g, '') : '',
        razaoSocial: fields.razao_social,
        nomeFantasia: fields.nome_fantasia,
        email: fields.email,
        telefone: fields.telefone,
        endereco: {
          logradouro: fields.endereco,
          numero: fields.numero,
          complemento: fields.complemento,
          bairro: fields.bairro,
          cidade: fields.cidade,
          uf: fields.uf,
          cep: fields.cep,
        },
        ativo: fields.ativo,
      };
      await addClient(payload);
      setFields({
        cnpj: '', cpf: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true
      });
      setDoc('');
      setSuccessModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cadastro de Cliente</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">CNPJ ou CPF *</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={doc}
              onChange={handleDocChange}
              placeholder="Digite o CNPJ ou CPF"
              required
              className="w-full"
            />
            <Button type="button" onClick={handleAutoFill} disabled={autoFillLoading || !isCNPJ(doc)}>
              {autoFillLoading ? 'Buscando...' : 'Buscar CNPJ'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Razão Social</label>
            <Input name="razao_social" value={fields.razao_social} onChange={handleFieldChange} disabled={isCNPJ(doc)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
            <Input name="nome_fantasia" value={fields.nome_fantasia} onChange={handleFieldChange} disabled={isCNPJ(doc)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <Input name="email" value={fields.email} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input name="telefone" value={fields.telefone} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <Input name="endereco" value={fields.endereco} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número</label>
            <Input name="numero" value={fields.numero} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Complemento</label>
            <Input name="complemento" value={fields.complemento} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bairro</label>
            <Input name="bairro" value={fields.bairro} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cidade</label>
            <Input name="cidade" value={fields.cidade} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UF</label>
            <Input name="uf" value={fields.uf} onChange={handleFieldChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CEP</label>
            <Input name="cep" value={fields.cep} onChange={handleFieldChange} />
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
        </Button>
      </form>
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente cadastrado!</DialogTitle>
            <DialogDescription>O cliente foi cadastrado com sucesso.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setSuccessModalOpen(false)}>Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
