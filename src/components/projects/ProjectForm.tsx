import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

export const ProjectForm = () => {
  const { addProject } = useProjects();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula loading
      addProject(formData);
      toast({
        title: 'Projeto cadastrado',
        description: 'Projeto cadastrado com sucesso.',
      });
      setFormData({ nome: '', descricao: '', ativo: true });
    } catch (e) {
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Cadastro de Projetos</h2>
        <p className="text-gray-600">Cadastre novos projetos</p>
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
              <Label htmlFor="ativo">Ativo</Label>
              <input
                id="ativo"
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="ml-2"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end space-x-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading} aria-label="Cadastrar Projeto">
            {loading ? 'Cadastrando...' : 'Cadastrar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  );
}; 