import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';

interface SupplierFormProps {
  onSuccess?: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doc, setDoc] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    telefone: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    ativo: true,
  });

  const isCNPJ = (value: string) => value.replace(/\D/g, '').length === 14;

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
          email: (data.qsa && data.qsa[0]?.nome) || '',
          telefone: data.telefone || '',
          logradouro: data.descricao_tipo_de_logradouro && data.logradouro
            ? `${data.descricao_tipo_de_logradouro} ${data.logradouro}`
            : '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep || '',
          ativo: data.situacao_cadastral === 'ATIVA',
        });
      } catch {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Usuário não está autenticado. Faça login novamente.');
        setLoading(false);
        return;
      }
      const payload = {
        cnpj: doc.replace(/\D/g, ''),
        razao_social: fields.razao_social,
        nome_fantasia: fields.nome_fantasia,
        email: fields.email,
        telefone: fields.telefone,
        endereco: {
          logradouro: fields.logradouro,
          numero: fields.numero,
          complemento: fields.complemento,
          bairro: fields.bairro,
          cidade: fields.cidade,
          uf: fields.uf,
          cep: fields.cep,
        },
        ativo: fields.ativo,
      };
      const { data, error: supaError } = await supabase.from('suppliers').insert([payload]).select();
      if (supaError) {
        setError(supaError.message);
        toast({ title: 'Erro ao cadastrar fornecedor', description: supaError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Fornecedor cadastrado!', description: 'O fornecedor foi cadastrado com sucesso.' });
        void logActivity({ action: 'create', entityType: 'fornecedor', entityId: data?.[0]?.id, entityName: fields.razao_social });
        setDoc('');
        setFields({
          cnpj: '', razao_social: '', nome_fantasia: '', email: '', telefone: '',
          logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true,
        });
        if (onSuccess) onSuccess();
        else navigate('/dashboard/pagar/fornecedores');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro ao salvar fornecedor.');
      toast({ title: 'Erro ao cadastrar fornecedor', description: msg, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cadastro de Fornecedor</h2>
          <p className="text-gray-600">Preencha os dados do fornecedor</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CNPJ *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={doc}
                  onChange={handleDocChange}
                  placeholder="Digite o CNPJ (apenas números)"
                  required
                  className="pl-3 w-full border rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={autoFillLoading || !isCNPJ(doc)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {autoFillLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Razão Social *</label>
              <input name="razao_social" value={fields.razao_social} onChange={handleFieldChange} placeholder="Razão social da empresa" required className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input name="nome_fantasia" value={fields.nome_fantasia} onChange={handleFieldChange} placeholder="Nome fantasia (opcional)" className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input name="email" value={fields.email} onChange={handleFieldChange} placeholder="E-mail de contato" type="email" className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <input name="telefone" value={fields.telefone} onChange={handleFieldChange} placeholder="Telefone" className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Logradouro</label>
              <input name="logradouro" value={fields.logradouro} onChange={handleFieldChange} placeholder="Rua, avenida..." className="w-full border rounded px-2 py-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input name="numero" value={fields.numero} onChange={handleFieldChange} placeholder="Número" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Complemento</label>
                <input name="complemento" value={fields.complemento} onChange={handleFieldChange} placeholder="Apto, sala, etc." className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input name="bairro" value={fields.bairro} onChange={handleFieldChange} placeholder="Bairro" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input name="cidade" value={fields.cidade} onChange={handleFieldChange} placeholder="Cidade" className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">UF</label>
                <input name="uf" value={fields.uf} onChange={handleFieldChange} placeholder="UF" className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input name="cep" value={fields.cep} onChange={handleFieldChange} placeholder="CEP" className="w-full border rounded px-2 py-1" />
              </div>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Fornecedor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
