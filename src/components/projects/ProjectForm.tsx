import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface ProjectFormProps {
  project?: Project | null;
  onBack?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onBack }) => {
  const { addProject, updateProject, loading } = useProjects();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: project?.nome || '',
    descricao: project?.descricao || '',
    ativo: project?.ativo ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, preencha o nome do projeto.',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (project) {
        await updateProject(project.id, formData);
        toast({ title: 'Projeto atualizado', description: 'Projeto atualizado com sucesso.' });
      } else {
        await addProject(formData);
        toast({ title: 'Projeto cadastrado', description: 'Projeto cadastrado com sucesso.' });
      }
      if (onBack) onBack();
      if (!project) setFormData({ nome: '', descricao: '', ativo: true });
    } catch (e) {
      toast({
        title: project ? 'Erro ao atualizar' : 'Erro ao cadastrar',
        description: project ? 'Não foi possível atualizar o projeto.' : 'Não foi possível cadastrar o projeto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{project ? 'Editar Projeto' : 'Cadastro de Projetos'}</h2>
        <p className="text-gray-600">{project ? 'Altere os dados do projeto' : 'Cadastre novos projetos'}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={checked => setFormData({ ...formData, ativo: checked })}
                  id="ativo"
                />
                Projeto Ativo
              </Label>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end space-x-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading} aria-label={project ? 'Salvar Projeto' : 'Cadastrar Projeto'}>
            {loading ? (project ? 'Salvando...' : 'Cadastrando...') : (project ? 'Salvar Alterações' : 'Cadastrar Projeto')}
          </Button>
        </div>
      </form>
    </div>
  );
}; 