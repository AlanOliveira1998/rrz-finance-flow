
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients, Client } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Building2, User, MapPin, Landmark, Hash, Home, LocateFixed, Building } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

function isCNPJ(value: string) {
  return value.replace(/\D/g, '').length === 14;
}

function isCPF(value: string) {
  return value.replace(/\D/g, '').length === 11;
}

interface ClientFormProps {
  client?: Client | null;
  onBack?: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onBack }) => {
  const { addClient, updateClient } = useClients();
  const { toast } = useToast();
  const [doc, setDoc] = useState(client?.cnpj || '');
  const [loading, setLoading] = useState(false);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    cnpj: client?.cnpj || '',
    cpf: '',
    razao_social: client?.razaoSocial || '',
    nome_fantasia: client?.nomeFantasia || '',
    email: client?.email || '',
    telefone: client?.telefone || '',
    endereco: client?.endereco?.logradouro || '',
    numero: client?.endereco?.numero || '',
    complemento: client?.endereco?.complemento || '',
    bairro: client?.endereco?.bairro || '',
    cidade: client?.endereco?.cidade || '',
    uf: client?.endereco?.uf || '',
    cep: client?.endereco?.cep || '',
    ativo: client?.ativo ?? true,
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
      if (client) {
        await updateClient(client.id, payload);
        toast({ title: 'Cliente atualizado!', description: 'As alterações foram salvas.' });
        if (onBack) onBack();
      } else {
        await addClient(payload);
        toast({ title: 'Cliente cadastrado!', description: 'O cliente foi cadastrado com sucesso.' });
        if (onBack) onBack();
      }
      if (!client) {
        setFields({
          cnpj: '', cpf: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true
        });
        setDoc('');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <p className="text-gray-600">{client ? 'Altere os dados do cliente' : 'Preencha os dados do cliente'}</p>
        </div>
        <Button variant="outline" type="button" onClick={() => window.history.back()}>
          Cancelar
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>CNPJ *</Label>
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
              <div>
                <Label>Razão Social *</Label>
                <Input name="razao_social" value={fields.razao_social} onChange={handleFieldChange} placeholder="Razão social da empresa" required />
              </div>
              <div>
                <Label>Nome Fantasia</Label>
                <Input name="nome_fantasia" value={fields.nome_fantasia} onChange={handleFieldChange} placeholder="Nome fantasia (opcional)" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input name="email" value={fields.email} onChange={handleFieldChange} placeholder="E-mail de contato" type="email" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input name="telefone" value={fields.telefone} onChange={handleFieldChange} placeholder="Telefone" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Switch
                    checked={fields.ativo}
                    onCheckedChange={checked => setFields({ ...fields, ativo: checked })}
                    id="ativo"
                  />
                  Cliente Ativo
                </Label>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logradouro</Label>
                <Input name="endereco" value={fields.endereco} onChange={handleFieldChange} placeholder="Rua, avenida..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input name="numero" value={fields.numero} onChange={handleFieldChange} placeholder="Número" />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input name="complemento" value={fields.complemento} onChange={handleFieldChange} placeholder="Apto, sala, etc." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input name="bairro" value={fields.bairro} onChange={handleFieldChange} placeholder="Bairro" />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input name="cidade" value={fields.cidade} onChange={handleFieldChange} placeholder="Cidade" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>UF</Label>
                  <Input name="uf" value={fields.uf} onChange={handleFieldChange} placeholder="UF" />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input name="cep" value={fields.cep} onChange={handleFieldChange} placeholder="CEP" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (client ? 'Salvando...' : 'Cadastrando...') : (client ? 'Salvar Alterações' : 'Cadastrar Cliente')}
          </Button>
        </div>
      </form>
    </div>
  );
};
