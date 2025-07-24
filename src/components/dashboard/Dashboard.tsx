
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ClientList } from '@/components/clients/ClientList';
import { ClientForm } from '@/components/clients/ClientForm';
import { Reports } from '@/components/reports/Reports';
import { UserManagement } from '@/components/admin/UserManagement';
import { Invoice } from '@/hooks/useInvoices';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaxesList } from '@/components/taxes/TaxesList';
import { Client } from '@/hooks/useClients';
import { Project } from '@/hooks/useProjects';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { PayBillsTable } from './PayBillsTable';
import Checklist from './Checklist'; // importar o novo componente
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const LogsPanel = () => {
  const [logs, setLogs] = React.useState<any[]>([]);
  React.useEffect(() => {
    setLogs(JSON.parse(localStorage.getItem('rrz_logs') || '[]').reverse());
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Histórico de Alterações</h2>
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
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">Nenhuma alteração registrada.</td></tr>
            )}
            {logs.map((log, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.user}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.type}</td>
                <td className="px-2 py-1 whitespace-nowrap">{log.action}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {log.type === 'cliente' && log.razaoSocial && `Cliente: ${log.razaoSocial}`}
                  {log.type === 'nota' && log.numero && `Nota: ${log.numero}`}
                  {log.type === 'projeto' && log.nome && `Projeto: ${log.nome}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Novo componente de cadastro de fornecedores
const SupplierForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [doc, setDoc] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [fields, setFields] = useState({
    cnpj: '',
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
  function isCNPJ(value: string) {
    return value.replace(/\D/g, '').length === 14;
  }
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
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Usuário não está autenticado. Faça login novamente.');
        setLoading(false);
        return;
      }
      // Montar payload
      const payload = {
        cnpj: doc.replace(/\D/g, ''),
        razao_social: fields.razao_social,
        nome_fantasia: fields.nome_fantasia,
        email: fields.email,
        telefone: fields.telefone,
        endereco: JSON.stringify({
          logradouro: fields.endereco,
          numero: fields.numero,
          complemento: fields.complemento,
          bairro: fields.bairro,
          cidade: fields.cidade,
          uf: fields.uf,
          cep: fields.cep,
        }),
        ativo: fields.ativo,
      };
      const { data, error: supaError } = await supabase.from('suppliers').insert([payload]).select();
      if (supaError) {
        setError(supaError.message);
        toast({ title: 'Erro ao cadastrar fornecedor', description: supaError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Fornecedor cadastrado!', description: 'O fornecedor foi cadastrado com sucesso.' });
        setDoc('');
        setFields({
          cnpj: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', ativo: true
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fornecedor.');
      toast({ title: 'Erro ao cadastrar fornecedor', description: err.message, variant: 'destructive' });
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
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
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
              <input name="endereco" value={fields.endereco} onChange={handleFieldChange} placeholder="Rua, avenida..." className="w-full border rounded px-2 py-1" />
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
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded" disabled={loading} >{loading ? 'Salvando...' : 'Cadastrar Fornecedor'}</button>
        </div>
      </form>
    </div>
  );
};

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line
  }, []);
  const fetchSuppliers = () => {
    setLoading(true);
    setError(null);
    supabase.from('suppliers').select('*').then(({ data, error }) => {
      if (error) setError(error.message);
      else setSuppliers(data || []);
      setLoading(false);
    });
  };
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch =
      s.cnpj?.toLowerCase().includes(search.toLowerCase()) ||
      s.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      s.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.telefone?.toLowerCase().includes(search.toLowerCase());
    const matchesAtivo = filterAtivo === 'all' || (filterAtivo === 'ativo' ? s.ativo : !s.ativo);
    return matchesSearch && matchesAtivo;
  });
  const handleEdit = (s: any) => {
    setEditId(s.id);
    setEditFields({ ...s, ...JSON.parse(s.endereco || '{}') });
  };
  const handleEditField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };
  const handleEditSave = async () => {
    setEditLoading(true);
    const payload = {
      razao_social: editFields.razao_social,
      nome_fantasia: editFields.nome_fantasia,
      email: editFields.email,
      telefone: editFields.telefone,
      ativo: editFields.ativo,
      endereco: JSON.stringify({
        logradouro: editFields.logradouro,
        numero: editFields.numero,
        complemento: editFields.complemento,
        bairro: editFields.bairro,
        cidade: editFields.cidade,
        uf: editFields.uf,
        cep: editFields.cep,
      })
    };
    const { error } = await supabase.from('suppliers').update(payload).eq('id', editId).select();
    if (error) {
      toast({ title: 'Erro ao editar fornecedor', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fornecedor atualizado!', description: 'Alterações salvas.' });
      setEditId(null);
      fetchSuppliers();
    }
    setEditLoading(false);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    setDeleteId(id);
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir fornecedor', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fornecedor excluído!', description: 'Fornecedor removido com sucesso.' });
      fetchSuppliers();
    }
    setDeleteId(null);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 shadow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </span>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Fornecedores RRZ</h2>
            <p className="text-gray-500 text-base">Gerencie todos os fornecedores cadastrados</p>
          </div>
        </div>
        <button
          className="bg-cyan-700 hover:bg-cyan-800 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2 transition"
          onClick={() => window.location.search = '?tab=pagar&sub=fornecedor-cadastro'}
        >
          <span className="text-lg">+</span> Novo Fornecedor
        </button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="relative w-full md:w-64">
          <span className="absolute left-2 top-1.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por CNPJ, razão social, e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded pl-8 pr-2 py-1 w-full focus:ring-2 focus:ring-cyan-300"
          />
        </div>
        <select
          value={filterAtivo}
          onChange={e => setFilterAtivo(e.target.value)}
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-300"
        >
          <option value="all">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center py-12 text-cyan-700 animate-pulse flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          Carregando fornecedores...
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 8c0-2.21-1.79-4-4-4s-4 1.79-4 4m8 0v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8m16 0a2 2 0 00-2-2m2 2a2 2 0 01-2 2m-8 0a2 2 0 012-2m-2 2a2 2 0 002 2" />
          </svg>
          Nenhum fornecedor encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-cyan-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">CNPJ</th>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">Razão Social</th>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">Nome Fantasia</th>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">E-mail</th>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">Telefone</th>
                <th className="px-4 py-2 text-left font-semibold text-cyan-700 uppercase whitespace-nowrap">Ativo</th>
                <th className="px-4 py-2 text-center font-semibold text-cyan-700 uppercase whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-cyan-50 transition">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-cyan-900">{s.cnpj}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="razao_social" value={editFields.razao_social || ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="font-semibold text-gray-900">{s.razao_social}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="nome_fantasia" value={editFields.nome_fantasia || ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="text-gray-700">{s.nome_fantasia}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="email" value={editFields.email || ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="text-gray-700">{s.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="telefone" value={editFields.telefone || ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-24" />
                    ) : (
                      <span className="text-gray-700">{s.telefone}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <select name="ativo" value={editFields.ativo ? 'true' : 'false'} onChange={e => setEditFields({ ...editFields, ativo: e.target.value === 'true' })} className="border rounded px-1 py-0.5">
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${s.ativo ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 text-gray-500 border border-gray-300'}`}>
                        {s.ativo ? (
                          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {editId === s.id ? (
                      <>
                        <button onClick={handleEditSave} className="inline-flex items-center justify-center text-cyan-700 hover:text-cyan-900 font-semibold mr-2" disabled={editLoading} title="Salvar"><Pencil size={18} /></button>
                        <button onClick={() => setEditId(null)} className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700" title="Cancelar"><span className="sr-only">Cancelar</span>✖️</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(s)} className="inline-flex items-center justify-center text-cyan-700 hover:text-cyan-900 mr-2 transition" title="Editar"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(s.id)} className="inline-flex items-center justify-center text-red-600 hover:text-red-800 transition" disabled={deleteId === s.id} title="Excluir"><Trash2 size={18} />{deleteId === s.id && <span className="ml-1 text-xs">...</span>}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Novo formulário de cadastro de boletos
const PayBillForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    fornecedor_id: '',
    mes_referencia: '',
    data_vencimento: '',
    data_pagamento: '',
    categoria: '',
    valor: '',
    status: 'pendente',
  });
  const { toast } = useToast();
  useEffect(() => {
    supabase.from('suppliers').select('id, razao_social').then(({ data }) => {
      setFornecedores(data || []);
    });
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }
      const payload = {
        fornecedor_id: fields.fornecedor_id,
        mes_referencia: fields.mes_referencia,
        data_vencimento: fields.data_vencimento || null,
        data_pagamento: fields.data_pagamento || null,
        categoria: fields.categoria,
        valor: fields.valor,
        status: fields.status,
      };
      const { error: supaError } = await supabase.from('pay_bills').insert([payload]);
      if (supaError) {
        setError(supaError.message);
        toast({ title: 'Erro ao cadastrar boleto', description: supaError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Boleto cadastrado!', description: 'O boleto foi cadastrado com sucesso.' });
        setFields({ fornecedor_id: '', mes_referencia: '', data_vencimento: '', data_pagamento: '', categoria: '', valor: '', status: 'pendente' });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar boleto.');
      toast({ title: 'Erro ao cadastrar boleto', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Cadastro de Boleto</h2>
          <p className="text-gray-600">Preencha os dados do boleto a pagar</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fornecedor *</label>
              <select name="fornecedor_id" value={fields.fornecedor_id} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
                <option value="">Selecione o fornecedor</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.razao_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria *</label>
              <input name="categoria" type="text" value={fields.categoria} onChange={handleChange} required className="border rounded px-2 py-1 w-full" placeholder="Ex: Energia, Internet, Aluguel..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mês de Referência *</label>
              <input name="mes_referencia" type="month" value={fields.mes_referencia} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor *</label>
              <input name="valor" type="number" min="0" step="0.01" value={fields.valor} onChange={handleChange} required className="border rounded px-2 py-1 w-full" placeholder="R$" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select name="status" value={fields.status} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Vencimento *</label>
              <input name="data_vencimento" type="date" value={fields.data_vencimento} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Pagamento</label>
              <input name="data_pagamento" type="date" value={fields.data_pagamento} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm font-semibold text-center border border-red-200 bg-red-50 rounded-md py-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded" disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar Boleto'}</button>
        </div>
      </form>
    </div>
  );
};

export const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Kanban hooks SEMPRE no topo
  const [kanban, setKanban] = React.useState({
    todo: [],
    doing: [],
    done: [],
    lembretes: [],
    reunioes: [],
  });
  const [newTask, setNewTask] = React.useState('');
  const [kanbanLoading, setKanbanLoading] = useState(false);

  // Buscar tarefas do Kanban do Supabase ao carregar
  useEffect(() => {
    if (!user?.id) return;
    setKanbanLoading(true);
    supabase
      .from('kanban_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setKanban({
            todo: data.filter(t => t.status === 'todo'),
            doing: data.filter(t => t.status === 'doing'),
            done: data.filter(t => t.status === 'done'),
            lembretes: data.filter(t => t.status === 'lembretes'),
            reunioes: data.filter(t => t.status === 'reunioes'),
          });
        }
        setKanbanLoading(false);
      });
  }, [user?.id]);

  // Map URL path to tab
  const path = location.pathname.replace(/^\/dashboard\/?/, '') || 'dashboard';

  // Extrair valor de sub da query string
  const searchParams = new URLSearchParams(location.search);
  const sub = searchParams.get('sub');

  // Definir activeTab corretamente para o Sidebar
  const activeTab = location.search.includes('tab=pagar') ? (sub || 'pagar-home') : path;

  // Função para navegar ao trocar de aba
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate('/dashboard'); break;
      case 'clients':
        navigate('/dashboard/clients'); break;
      case 'new-client':
        navigate('/dashboard/new-client'); break;
      case 'projects':
        navigate('/dashboard/projects'); break;
      case 'new-project':
        navigate('/dashboard/new-project'); break;
      case 'invoices':
        navigate('/dashboard/invoices'); break;
      case 'new-invoice':
        navigate('/dashboard/new-invoice'); break;
      case 'reports':
        navigate('/dashboard/reports'); break;
      case 'users':
        navigate('/dashboard/users'); break;
      case 'taxes':
        navigate('/dashboard/taxes'); break;
      case 'logs':
        navigate('/dashboard/logs'); break;
      case 'kanban':
        navigate('/dashboard/kanban'); break;
      // Corrigir navegação para abas de contas a pagar e fornecedores
      case 'pagar-home':
        navigate('/dashboard?tab=pagar'); break;
      case 'pagar-lista':
        navigate('/dashboard?tab=pagar&sub=lista'); break;
      case 'pagar-nova':
        navigate('/dashboard?tab=pagar&sub=nova'); break;
      case 'fornecedor-cadastro':
        navigate('/dashboard?tab=pagar&sub=fornecedor-cadastro'); break;
      case 'fornecedor-lista':
        navigate('/dashboard?tab=pagar&sub=fornecedor-lista'); break;
      case 'boletos-cadastro':
        navigate('/dashboard?tab=pagar&sub=boletos-cadastro'); break;
      default:
        navigate('/dashboard');
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    navigate('/dashboard/new-invoice');
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    navigate('/dashboard/new-client');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    // setActiveTab('clients'); // Removed
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    // setActiveTab('new-project'); // Removed
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    // setActiveTab('projects'); // Removed
  };

  const renderContent = () => {
    return (
      <Routes>
        <Route path="" element={<DashboardOverview />} />
        <Route path="clients" element={<ClientList onEdit={handleEditClient} />} />
        <Route path="new-client" element={<ClientForm client={selectedClient} onBack={handleBackToClients} />} />
        <Route path="projects" element={<ProjectList onEdit={handleEditProject} />} />
        <Route path="new-project" element={<ProjectForm project={selectedProject} onBack={handleBackToProjects} />} />
        <Route path="invoices" element={<InvoiceList onEdit={handleEditInvoice} />} />
        <Route path="new-invoice" element={<InvoiceForm invoice={selectedInvoice} onBack={() => navigate('/dashboard/invoices')} />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="taxes" element={<TaxesList />} />
        <Route path="logs" element={<LogsPanel />} />
        <Route path="kanban" element={<KanbanAtividades kanban={kanban} setKanban={setKanban} />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };

  // Kanban de Atividades como componente separado
  const KanbanAtividades = ({ kanban, setKanban }) => {
    const { toast } = useToast();
    // Novo: um estado para cada input de nova tarefa por coluna
    const [newTasks, setNewTasks] = React.useState({
      todo: '',
      doing: '',
      done: '',
      lembretes: '',
      reunioes: '',
    });
    // Adicionar tarefa em qualquer coluna
    const handleAddTask = async (colKey) => {
      const text = newTasks[colKey]?.trim();
      if (!text || !user?.id) return;
      setKanbanLoading(true);
      const { data, error } = await supabase
        .from('kanban_tasks')
        .insert([{ user_id: user.id, text, status: colKey }])
        .select();
      if (!error && data && data[0]) {
        setKanban(prev => ({ ...prev, [colKey]: [...prev[colKey], data[0]] }));
        setNewTasks(prev => ({ ...prev, [colKey]: '' }));
        toast({ title: 'Tarefa criada', description: `Tarefa adicionada em "${columns.find(c => c.key === colKey)?.label}".` });
      }
      setKanbanLoading(false);
    };
    // Mover tarefa entre colunas
    const moveTask = async (fromCol, fromIdx, toCol) => {
      const item = kanban[fromCol][fromIdx];
      if (!item) return;
      setKanbanLoading(true);
      const { error } = await supabase
        .from('kanban_tasks')
        .update({ status: toCol })
        .eq('id', item.id);
      if (!error) {
        setKanban(prev => {
          const newFrom = [...prev[fromCol]];
          newFrom.splice(fromIdx, 1);
          const newTo = [...prev[toCol], { ...item, status: toCol }];
          return { ...prev, [fromCol]: newFrom, [toCol]: newTo };
        });
        toast({ title: 'Tarefa movida', description: `Tarefa movida para "${columns.find(c => c.key === toCol)?.label}".` });
      }
      setKanbanLoading(false);
    };
    // Remover tarefa
    const removeTask = async (col, idx) => {
      const item = kanban[col][idx];
      if (!item) return;
      setKanbanLoading(true);
      const { error } = await supabase
        .from('kanban_tasks')
        .delete()
        .eq('id', item.id);
      if (!error) {
        setKanban(prev => {
          const newCol = [...prev[col]];
          newCol.splice(idx, 1);
          return { ...prev, [col]: newCol };
        });
        toast({ title: 'Tarefa removida', description: 'A tarefa foi removida com sucesso.' });
      }
      setKanbanLoading(false);
    };
    const handleDragStart = (col, idx) => (e) => {
      e.dataTransfer.setData('col', col);
      e.dataTransfer.setData('idx', idx);
    };
    const handleDrop = (targetCol) => (e) => {
      const fromCol = e.dataTransfer.getData('col');
      const fromIdx = parseInt(e.dataTransfer.getData('idx'), 10);
      if (fromCol && fromCol !== targetCol) {
        moveTask(fromCol, fromIdx, targetCol);
      }
    };
    const handleDragOver = (e) => e.preventDefault();
    // Colunas do Kanban
    const columns = [
      { key: 'todo', label: 'A Fazer', color: 'bg-red-50' },
      { key: 'doing', label: 'Em Andamento', color: 'bg-yellow-50' },
      { key: 'done', label: 'Realizado', color: 'bg-green-50' },
      { key: 'lembretes', label: 'Lembretes', color: 'bg-blue-50' },
      { key: 'reunioes', label: 'Reuniões', color: 'bg-purple-50' },
    ];
    // Estado para edição inline
    const [editingTask, setEditingTask] = React.useState({ col: null, idx: null });
    const [editingText, setEditingText] = React.useState('');

    // Salvar edição
    const handleEditSave = async (col, idx) => {
      const item = kanban[col][idx];
      if (!item || !editingText.trim()) {
        setEditingTask({ col: null, idx: null });
        setEditingText('');
        return;
      }
      setKanbanLoading(true);
      const { error } = await supabase
        .from('kanban_tasks')
        .update({ text: editingText.trim() })
        .eq('id', item.id);
      if (!error) {
        setKanban(prev => {
          const newCol = [...prev[col]];
          newCol[idx] = { ...newCol[idx], text: editingText.trim() };
          return { ...prev, [col]: newCol };
        });
        toast({ title: 'Tarefa editada', description: 'O texto da tarefa foi atualizado.' });
      }
      setEditingTask({ col: null, idx: null });
      setEditingText('');
      setKanbanLoading(false);
    };
    // Estado para controle do modal de remoção
    const [removeDialog, setRemoveDialog] = React.useState({ open: false, col: null, idx: null });

    // Função para abrir o modal
    const handleRemoveClick = (col, idx) => {
      setRemoveDialog({ open: true, col, idx });
    };
    // Função para confirmar remoção
    const handleRemoveConfirm = async () => {
      if (removeDialog.col !== null && removeDialog.idx !== null) {
        await removeTask(removeDialog.col, removeDialog.idx);
      }
      setRemoveDialog({ open: false, col: null, idx: null });
    };
    // Função para cancelar
    const handleRemoveCancel = () => {
      setRemoveDialog({ open: false, col: null, idx: null });
    };
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={"kanban"} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex gap-6 h-[70vh]">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={`flex-1 rounded-lg shadow p-4 flex flex-col ${col.color}`}
                  onDrop={handleDrop(col.key)}
                  onDragOver={handleDragOver}
                >
                  <h3 className="font-bold text-lg mb-4 text-gray-700">{col.label}</h3>
                  {/* Input de nova tarefa em todas as colunas */}
                  <div className="mb-4 flex gap-2">
                    <input
                      className="flex-1 border rounded px-2 py-1"
                      placeholder={`Adicionar em ${col.label}...`}
                      value={newTasks[col.key] || ''}
                      onChange={e => setNewTasks(prev => ({ ...prev, [col.key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask(col.key)}
                      disabled={kanbanLoading}
                    />
                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleAddTask(col.key)} disabled={kanbanLoading}>Adicionar</button>
                  </div>
                  <div className="flex-1 space-y-2 min-h-[40px]">
                    {kanban[col.key]?.map((card, idx) => (
                      <div
                        key={card.id}
                        className="bg-gray-100 rounded p-3 shadow cursor-move group flex items-center"
                        draggable
                        onDragStart={handleDragStart(col.key, idx)}
                      >
                        {editingTask.col === col.key && editingTask.idx === idx ? (
                          <input
                            className="flex-1 border rounded px-2 py-1 mr-2"
                            value={editingText}
                            autoFocus
                            onChange={e => setEditingText(e.target.value)}
                            onBlur={() => handleEditSave(col.key, idx)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditSave(col.key, idx);
                              if (e.key === 'Escape') { setEditingTask({ col: null, idx: null }); setEditingText(''); }
                            }}
                            disabled={kanbanLoading}
                          />
                        ) : (
                          <span className="flex-1 cursor-pointer" onClick={() => { setEditingTask({ col: col.key, idx }); setEditingText(card.text); }}>{card.text}</span>
                        )}
                        <button
                          className="ml-2 text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                          onClick={() => handleRemoveClick(col.key, idx)}
                          disabled={kanbanLoading}
                        >Remover</button>
                      </div>
                    ))}
                  </div>
                  {kanbanLoading && <div className="text-center text-blue-400 mt-2 animate-pulse">Sincronizando...</div>}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
      {/* Modal de confirmação de remoção */}
      <AlertDialog open={removeDialog.open} onOpenChange={open => !open && handleRemoveCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tarefa</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover esta tarefa? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRemoveCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Renderizar SupplierForm na aba de cadastro de fornecedores
  if (location.search.includes('tab=pagar') && sub === 'fornecedor-cadastro') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <SupplierForm onSuccess={() => { navigate('/dashboard?tab=pagar&sub=fornecedor-lista'); }} />
          </main>
        </div>
      </div>
    );
  }

  // Renderizar SupplierList na aba de lista de fornecedores
  if (location.search.includes('tab=pagar') && sub === 'fornecedor-lista') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <SupplierList />
          </main>
        </div>
      </div>
    );
  }

  // Renderizar PayBillForm na aba de cadastro de boletos
  if (location.search.includes('tab=pagar') && sub === 'boletos-cadastro') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <PayBillForm />
          </main>
        </div>
      </div>
    );
  }

  // Adicionar lógica para exibir DashboardOverview na aba Contas a Receber
  if (location.search.includes('tab=receber')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={path} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardOverview />
          </main>
        </div>
      </div>
    );
  }

  // Adicionar lógica para exibir página inicial em branco na aba Contas a Pagar
  if (location.search.includes('tab=pagar')) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col overflow-hidden ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <PayBillsTable />
          </main>
        </div>
      </div>
    );
  }

  // Adicionar lógica para exibir área em branco na aba Rotinas
  if (location.search.includes('tab=rotinas')) {
    // Verifica a rota para decidir o que renderizar
    if (location.pathname.endsWith('/kanban')) {
      // Kanban de Atividades
      const handleAddTask = () => {
        if (newTask.trim()) {
          setKanban(prev => ({ ...prev, todo: [...prev.todo, { id: Date.now(), text: newTask }] }));
          setNewTask('');
        }
      };
      const handleDragStart = (col, idx) => (e) => {
        e.dataTransfer.setData('col', col);
        e.dataTransfer.setData('idx', idx);
      };
      const handleDrop = (targetCol) => (e) => {
        const fromCol = e.dataTransfer.getData('col');
        const fromIdx = parseInt(e.dataTransfer.getData('idx'), 10);
        if (fromCol && fromCol !== targetCol) {
          const item = kanban[fromCol][fromIdx];
          setKanban(prev => {
            const newFrom = [...prev[fromCol]];
            newFrom.splice(fromIdx, 1);
            const newTo = [...prev[targetCol], item];
            return { ...prev, [fromCol]: newFrom, [targetCol]: newTo };
          });
        }
      };
      const handleDragOver = (e) => e.preventDefault();
      return (
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="flex-1 flex flex-col overflow-hidden ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-6 h-[70vh]">
                {['todo', 'doing', 'done'].map((col, i) => (
                  <div
                    key={col}
                    className={`flex-1 rounded-lg shadow p-4 flex flex-col ${
                      col === 'todo' ? 'bg-red-50' : col === 'doing' ? 'bg-yellow-50' : 'bg-green-50'
                    }`}
                    onDrop={handleDrop(col)}
                    onDragOver={handleDragOver}
                  >
                    <h3 className="font-bold text-lg mb-4 text-gray-700">
                      {col === 'todo' && 'A Fazer'}
                      {col === 'doing' && 'Em Andamento'}
                      {col === 'done' && 'Realizado'}
                    </h3>
                    {col === 'todo' && (
                      <div className="mb-4 flex gap-2">
                        <input
                          className="flex-1 border rounded px-2 py-1"
                          placeholder="Adicionar atividade..."
                          value={newTask}
                          onChange={e => setNewTask(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                        />
                        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAddTask}>Adicionar</button>
                      </div>
                    )}
                    <div className="flex-1 space-y-2 min-h-[40px]">
                      {kanban[col].map((card, idx) => (
                        <div
                          key={card.id}
                          className="bg-gray-100 rounded p-3 shadow cursor-move"
                          draggable
                          onDragStart={handleDragStart(col, idx)}
                        >
                          {card.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      );
    } else if (location.pathname.endsWith('/checklist')) {
      // Checklist de Rotinas
      return (
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="flex-1 flex flex-col overflow-hidden ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Checklist />
            </main>
          </div>
        </div>
      );
    } else {
      // Página inicial da aba Rotinas (pode ser em branco ou mostrar instruções)
      return (
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="flex-1 flex flex-col overflow-hidden ml-64">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-bold mb-2">Bem-vindo à área de Rotinas</h2>
                <p>Selecione uma opção no menu lateral para começar.</p>
              </div>
            </main>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={path} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
