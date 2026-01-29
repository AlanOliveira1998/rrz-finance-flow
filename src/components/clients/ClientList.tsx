
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { Search, Edit, Trash2, Building } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/hooks/useClients';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';

interface ClientListProps {
  onEdit?: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onEdit }) => {
  const { clients, deleteClient, loading } = useClients();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToDelete, setClientToDelete] = useState<{ id: string, razaoSocial: string } | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      (client.razaoSocial?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      client.cnpj.includes(searchTerm) ||
      (client.nomeFantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? client.ativo : !client.ativo;
    return matchesSearch && matchesStatus;
  });

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const handleDelete = async (id: string) => {
    setLoadingDelete(id);
    try {
      await deleteClient(id);
      toast({ title: 'Cliente excluído', description: 'Cliente removido com sucesso.' });
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir o cliente.', variant: 'destructive' });
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por razão social, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { error } = await supabase.from('clients').update({ ativo: true }).neq('ativo', true);
              if (!error) {
                toast({ title: 'Todos os clientes ativados!' });
                // Atualiza lista
                window.location.reload();
              } else {
                toast({ title: 'Erro ao ativar todos', description: error.message, variant: 'destructive' });
              }
            }}
          >Ativar todos</Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { error } = await supabase.from('clients').update({ ativo: false }).neq('ativo', false);
              if (!error) {
                toast({ title: 'Todos os clientes inativados!' });
                // Atualiza lista
                window.location.reload();
              } else {
                toast({ title: 'Erro ao inativar todos', description: error.message, variant: 'destructive' });
              }
            }}
          >Inativar todos</Button>
        </div>
      </div>

      {/* Substituir o grid de cards por uma lista/tabela */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Razão Social</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8">Carregando...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8">Nenhum cliente cadastrado.</td></tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2 font-medium text-gray-900">{client.razaoSocial}</td>
                  <td className="px-4 py-2 text-gray-700">{formatCNPJ(client.cnpj)}</td>
                  <td className="px-4 py-2 text-gray-700">{client.email || '-'}</td>
                  <td className="px-4 py-2 text-gray-700">{client.telefone || '-'}</td>
                  <td className="px-4 py-2 text-gray-700">{client.endereco?.cidade || '-'}{client.endereco?.uf ? `/${client.endereco.uf}` : ''}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {client.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit && onEdit(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => setClientToDelete({ id: client.id, razaoSocial: client.razaoSocial })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece cadastrando um novo cliente'}
          </p>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!clientToDelete} onOpenChange={open => { if (!open) setClientToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <b>{clientToDelete?.razaoSocial}</b>? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingDelete !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && handleDelete(clientToDelete.id)}
              disabled={loadingDelete !== null}
            >
              {loadingDelete !== null ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
