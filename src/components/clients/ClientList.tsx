
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { Search, Edit, Trash2, Building } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export const ClientList = () => {
  const { clients, deleteClient, loading } = useClients();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToDelete, setClientToDelete] = useState<{ id: string, razaoSocial: string } | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  const filteredClients = clients.filter(client =>
    client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj.includes(searchTerm) ||
    (client.nomeFantasia && client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600">Gerencie seus clientes cadastrados</p>
        </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8">Nenhum cliente cadastrado.</div>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{client.razaoSocial}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
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
                  </div>
                </div>
                {client.nomeFantasia && (
                  <p className="text-sm text-gray-600">{client.nomeFantasia}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">CNPJ:</p>
                  <p className="text-sm text-gray-600">{formatCNPJ(client.cnpj)}</p>
                </div>
                {client.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">E-mail:</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                )}
                {client.telefone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Telefone:</p>
                    <p className="text-sm text-gray-600">{client.telefone}</p>
                  </div>
                )}
                {client.endereco?.cidade && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cidade:</p>
                    <p className="text-sm text-gray-600">{client.endereco.cidade} - {client.endereco.uf}</p>
                  </div>
                )}
                <div className="pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
