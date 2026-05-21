import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface SupplierAddress {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

interface Supplier {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  endereco?: SupplierAddress | string;
}

interface EditFields extends Omit<Supplier, 'endereco'> {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

function parseEndereco(endereco: Supplier['endereco']): SupplierAddress {
  if (!endereco) return {}
  if (typeof endereco === 'string') {
    try { return JSON.parse(endereco) } catch { return {} }
  }
  return endereco
}

const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<EditFields>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = () => {
    setLoading(true);
    setError(null);
    supabase.from('suppliers').select('*').then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setSuppliers((data as Supplier[]) ?? []);
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

  const handleEdit = (s: Supplier) => {
    const addr = parseEndereco(s.endereco);
    setEditId(s.id);
    setEditFields({ ...s, ...addr });
  };

  const handleEditField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editId) return;
    setEditLoading(true);
    const payload = {
      razao_social: editFields.razao_social,
      nome_fantasia: editFields.nome_fantasia,
      email: editFields.email,
      telefone: editFields.telefone,
      ativo: editFields.ativo,
      endereco: {
        logradouro: editFields.logradouro,
        numero: editFields.numero,
        complemento: editFields.complemento,
        bairro: editFields.bairro,
        cidade: editFields.cidade,
        uf: editFields.uf,
        cep: editFields.cep,
      },
    };
    const { error: err } = await supabase.from('suppliers').update(payload).eq('id', editId).select();
    if (err) {
      toast({ title: 'Erro ao editar fornecedor', description: err.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fornecedor atualizado!', description: 'Alterações salvas.' });
      void logActivity({ action: 'update', entityType: 'fornecedor', entityId: editId, entityName: editFields.razao_social });
      setEditId(null);
      fetchSuppliers();
    }
    setEditLoading(false);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.id;
    if (!id) return;
    setDeleteDialog({ open: false, id: null });
    const { error: err } = await supabase.from('suppliers').delete().eq('id', id);
    if (err) {
      toast({ title: 'Erro ao excluir fornecedor', description: err.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fornecedor excluído!', description: 'Fornecedor removido com sucesso.' });
      void logActivity({ action: 'delete', entityType: 'fornecedor', entityId: id });
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
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
          onClick={() => navigate('/dashboard/pagar/fornecedores/novo')}
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
        <div className="text-center py-12 text-cyan-700 animate-pulse">Carregando fornecedores...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-4">{error}</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum fornecedor encontrado.</div>
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
                      <input name="razao_social" value={editFields.razao_social ?? ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="font-semibold text-gray-900">{s.razao_social}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="nome_fantasia" value={editFields.nome_fantasia ?? ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="text-gray-700">{s.nome_fantasia}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="email" value={editFields.email ?? ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-32" />
                    ) : (
                      <span className="text-gray-700">{s.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <input name="telefone" value={editFields.telefone ?? ''} onChange={handleEditField} className="border rounded px-1 py-0.5 w-24" />
                    ) : (
                      <span className="text-gray-700">{s.telefone}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {editId === s.id ? (
                      <select
                        name="ativo"
                        value={editFields.ativo ? 'true' : 'false'}
                        onChange={e => setEditFields({ ...editFields, ativo: e.target.value === 'true' })}
                        className="border rounded px-1 py-0.5"
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${s.ativo ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 text-gray-500 border border-gray-300'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {editId === s.id ? (
                      <>
                        <button onClick={handleEditSave} className="inline-flex items-center justify-center text-cyan-700 hover:text-cyan-900 font-semibold mr-2" disabled={editLoading} title="Salvar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setEditId(null)} className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700" title="Cancelar">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(s)} className="inline-flex items-center justify-center text-cyan-700 hover:text-cyan-900 mr-2 transition" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, id: s.id })} className="inline-flex items-center justify-center text-red-600 hover:text-red-800 transition" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: null })}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierList;
