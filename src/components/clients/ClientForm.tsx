
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Building2, User, MapPin, Landmark, Hash, Home, LocateFixed, Building } from 'lucide-react';

function isCNPJ(value: string) {
  return value.replace(/\D/g, '').length === 14;
}

function isCPF(value: string) {
  return value.replace(/\D/g, '').length === 11;
}

export const ClientForm = () => {
  const { addClient } = useClients();
  const { toast } = useToast();
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
      toast({ title: 'Cliente cadastrado!', description: 'O cliente foi cadastrado com sucesso.' });
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-slate-100 py-8 pl-64">
      <Card className="w-full h-full shadow-2xl rounded-2xl border-0">
        <CardHeader className="pb-2 text-center">
          <Building2 className="mx-auto h-10 w-10 text-blue-600 mb-2" />
          <CardTitle className="text-3xl font-bold text-blue-700">Cadastro de Cliente</CardTitle>
          <p className="text-gray-500 mt-1">Preencha os dados abaixo para cadastrar um novo cliente</p>
        </CardHeader>
        <CardContent className="w-full h-full">
          <form onSubmit={handleSubmit} className="space-y-6 w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">CNPJ *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Hash size={18} /></span>
                    <Input
                      type="text"
                      value={doc}
                      onChange={handleDocChange}
                      placeholder="Digite o CNPJ (apenas números)"
                      required
                      className="pl-10 w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={autoFillLoading || !isCNPJ(doc)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {autoFillLoading ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Razão Social *</label>
                <span className="absolute left-3 top-9 text-gray-400"><Landmark size={18} /></span>
                <Input name="razao_social" value={fields.razao_social} onChange={handleFieldChange} placeholder="Razão social da empresa" required className="pl-10 w-full" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
                <span className="absolute left-3 top-9 text-gray-400"><User size={18} /></span>
                <Input name="nome_fantasia" value={fields.nome_fantasia} onChange={handleFieldChange} placeholder="Nome fantasia (opcional)" className="pl-10 w-full" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <span className="absolute left-3 top-9 text-gray-400"><Mail size={18} /></span>
                <Input name="email" value={fields.email} onChange={handleFieldChange} placeholder="E-mail de contato" type="email" className="pl-10 w-full" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <span className="absolute left-3 top-9 text-gray-400"><Phone size={18} /></span>
                <Input name="telefone" value={fields.telefone} onChange={handleFieldChange} placeholder="Telefone" className="pl-10 w-full" />
              </div>
            </div>

            <div className="pt-2 pb-1">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2 mb-2"><MapPin size={20} /> Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Logradouro</label>
                  <span className="absolute left-3 top-9 text-gray-400"><Home size={18} /></span>
                  <Input name="endereco" value={fields.endereco} onChange={handleFieldChange} placeholder="Rua, avenida..." className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <span className="absolute left-3 top-9 text-gray-400"><LocateFixed size={18} /></span>
                  <Input name="numero" value={fields.numero} onChange={handleFieldChange} placeholder="Número" className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Complemento</label>
                  <span className="absolute left-3 top-9 text-gray-400"><Building2 size={18} /></span>
                  <Input name="complemento" value={fields.complemento} onChange={handleFieldChange} placeholder="Apto, sala, etc." className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <span className="absolute left-3 top-9 text-gray-400"><Building size={18} /></span>
                  <Input name="bairro" value={fields.bairro} onChange={handleFieldChange} placeholder="Bairro" className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <span className="absolute left-3 top-9 text-gray-400"><Building size={18} /></span>
                  <Input name="cidade" value={fields.cidade} onChange={handleFieldChange} placeholder="Cidade" className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">UF</label>
                  <span className="absolute left-3 top-9 text-gray-400"><MapPin size={18} /></span>
                  <Input name="uf" value={fields.uf} onChange={handleFieldChange} placeholder="UF" className="pl-10 w-full" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">CEP</label>
                  <span className="absolute left-3 top-9 text-gray-400"><MapPin size={18} /></span>
                  <Input name="cep" value={fields.cep} onChange={handleFieldChange} placeholder="CEP" className="pl-10 w-full" />
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}

            <div className="pt-2 flex justify-center">
              <Button type="submit" disabled={loading} className="w-full md:w-1/2 text-lg py-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors">
                <Building2 size={20} />
                {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
