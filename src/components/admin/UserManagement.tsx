
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const UserManagement = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso negado. Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  const mockUsers = [
    { id: '1', name: 'Administrador RRZ', email: 'admin@rrz.com', role: 'admin', status: 'ativo' },
    { id: '2', name: 'Analista Financeiro', email: 'financeiro@rrz.com', role: 'financeiro', status: 'ativo' },
    { id: '3', name: 'Consultor', email: 'consultor@rrz.com', role: 'leitura', status: 'inativo' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
                {mockUsers.map((user) => (
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
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm">
                          Desativar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
