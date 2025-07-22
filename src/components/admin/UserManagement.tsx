
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'leitura' });
  const [formLoading, setFormLoading] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'leitura', password: '' });
  const [editLoading, setEditLoading] = useState(false);

  React.useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
          toast({ title: 'Erro', description: 'Não foi possível carregar usuários', variant: 'destructive' });
        } else {
          setUsers(data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [showModal]);

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso negado. Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  const handleOpenModal = () => {
    setForm({ name: '', email: '', password: '', role: 'leitura' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const { register } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const { success, error } = await register(form.email, form.password, form.name, form.role);
      if (!success) throw new Error(error || 'Erro ao cadastrar usuário');
      toast({ title: 'Usuário cadastrado', description: 'Usuário cadastrado com sucesso!' });
      setShowModal(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditModal = (user: any) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, password: '' });
  };
  const handleCloseEditModal = () => {
    setEditUser(null);
    setEditForm({ name: '', email: '', role: 'leitura', password: '' });
  };
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // Atualiza dados do profile
      const { error } = await supabase.from('profiles').update({ name: editForm.name, email: editForm.email, role: editForm.role }).eq('id', editUser.id);
      if (error) throw new Error(error.message);
      // Atualiza senha se preenchida
      if (editForm.password) {
        const { error: passError } = await supabase.auth.admin.updateUserById(editUser.id, { password: editForm.password });
        if (passError) throw new Error('Erro ao atualizar senha: ' + passError.message);
      }
      toast({ title: 'Usuário atualizado', description: 'Usuário atualizado com sucesso!' });
      setEditUser(null);
      setEditForm({ name: '', email: '', role: 'leitura', password: '' });
      // Atualiza lista
      setLoading(true);
      const { data, error: fetchError } = await supabase.from('profiles').select('*');
      if (!fetchError) setUsers(data || []);
      setLoading(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editForm.email) return;
    setEditLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(editForm.email);
      if (error) throw new Error(error.message);
      toast({ title: 'E-mail enviado', description: 'E-mail de redefinição de senha enviado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenModal}>
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Nome</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Função</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">Nenhum usuário cadastrado.</td></tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'financeiro' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(user)}>
                            Editar
                          </Button>
                          <Button
                            variant={user.ativo ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={async () => {
                              const { error } = await supabase.from('profiles').update({ ativo: !user.ativo }).eq('id', user.id);
                              if (!error) {
                                setLoading(true);
                                const { data, error: fetchError } = await supabase.from('profiles').select('*');
                                if (!fetchError) setUsers(data || []);
                                setLoading(false);
                                toast({ title: user.ativo ? 'Usuário desativado' : 'Usuário ativado', description: `Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso!` });
                              } else {
                                toast({ title: 'Erro', description: error.message, variant: 'destructive' });
                              }
                            }}
                            disabled={loading}
                          >
                            {user.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de cadastro de usuário */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" value={form.name} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
              <select id="role" name="role" value={form.role} onChange={handleFormChange} className="w-full border rounded p-2">
                <option value="admin">Administrador</option>
                <option value="financeiro">Financeiro</option>
                <option value="leitura">Leitura</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={formLoading}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formLoading}>
                {formLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de usuário */}
      <Dialog open={!!editUser} onOpenChange={open => { if (!open) handleCloseEditModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" name="name" value={editForm.name} onChange={handleEditFormChange} required />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={editForm.email} onChange={handleEditFormChange} required />
            </div>
            <div>
              <Label htmlFor="edit-role">Função</Label>
              <select id="edit-role" name="role" value={editForm.role} onChange={handleEditFormChange} className="w-full border rounded p-2">
                <option value="admin">Administrador</option>
                <option value="financeiro">Financeiro</option>
                <option value="leitura">Leitura</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEditModal} disabled={editLoading}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={editLoading}>
                {editLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleResetPassword} disabled={editLoading}>
                Enviar e-mail de redefinição de senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permissões por Função</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-red-600">Administrador</h4>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Acesso total ao sistema</li>
                <li>• Gerenciar usuários</li>
                <li>• Todas as funcionalidades</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600">Financeiro</h4>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Criar/editar notas fiscais</li>
                <li>• Visualizar relatórios</li>
                <li>• Exportar dados</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-600">Leitura</h4>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Visualizar dashboard</li>
                <li>• Consultar notas fiscais</li>
                <li>• Visualizar relatórios</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total de Usuários:</span>
                <span className="font-bold">3</span>
              </div>
              <div className="flex justify-between">
                <span>Usuários Ativos:</span>
                <span className="font-bold text-green-600">2</span>
              </div>
              <div className="flex justify-between">
                <span>Usuários Inativos:</span>
                <span className="font-bold text-gray-600">1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full">
              Exportar Lista de Usuários
            </Button>
            <Button variant="outline" className="w-full">
              Log de Atividades
            </Button>
            <Button variant="outline" className="w-full">
              Configurações de Segurança
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
