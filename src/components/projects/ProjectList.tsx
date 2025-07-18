import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export const ProjectList = () => {
  const { projects, deleteProject } = useProjects();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string, nome: string } | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.descricao && project.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string, nome: string) => {
    setLoadingDelete(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      deleteProject(id);
      toast({
        title: 'Projeto excluído',
        description: `Projeto ${nome} foi excluído com sucesso.`,
        variant: 'default',
      });
    } catch (e) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDelete(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projetos</h2>
          <p className="text-gray-600">Gerencie seus projetos cadastrados</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.nome}</CardTitle>
                  {project.descricao && (
                    <p className="text-sm text-gray-600">{project.descricao}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => setProjectToDelete({ id: project.id, nome: project.nome })}
                    disabled={loadingDelete}
                  >
                    {loadingDelete && projectToDelete?.id === project.id ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {project.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum projeto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece cadastrando um novo projeto'}
          </p>
        </div>
      )}
      {/* Modal de confirmação de exclusão de projeto */}
      <AlertDialog open={!!projectToDelete} onOpenChange={open => { if (!open) setProjectToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto <b>{projectToDelete?.nome}</b>? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && handleDelete(projectToDelete.id, projectToDelete.nome)}
              disabled={loadingDelete}
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 