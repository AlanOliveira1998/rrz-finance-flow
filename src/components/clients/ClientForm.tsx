
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function isCNPJ(value: string) {
  return value.replace(/\D/g, '').length === 14;
}

function isCPF(value: string) {
  return value.replace(/\D/g, '').length === 11;
}

export const ClientForm = () => {
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
        const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanDoc}`);
        const data = await res.json();
        if (data.status === 'ERROR') {
          setError('CNPJ não encontrado ou limite de requisições atingido. Preencha manualmente.');
        } else {
          setFields({
            ...fields,
            cnpj: cleanDoc,
            razao_social: data.nome || '',
            nome_fantasia: data.fantasia || '',
            email: data.email || '',
            telefone: data.telefone || '',
            endereco: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.municipio || '',
            uf: data.uf || '',
            cep: data.cep || '',
            ativo: true,
          });
        }
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
      const payload = isCNPJ(doc) ? { ...fields, cnpj: doc.replace(/\D/g, '') } : { ...fields, cpf: doc.replace(/\D/g, '') };
      const { data, error: supaError } = await supabase.from('clients').insert([payload]).select();
      if (supaError) {
        setError(supaError.message);
      } else {
        setFields({
          cnpj: '', cpf: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true
        });
        setDoc('');
        alert('Cliente cadastrado com sucesso!');
      }
    } catch (err) {
      setError('Erro ao cadastrar cliente.');
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
    </div>
  );
};
