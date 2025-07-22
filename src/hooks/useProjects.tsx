import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Project {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at?: string;
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  addProject: (projectData: Omit<Project, 'id' | 'created_at'>) => Promise<void>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('projects').select('*').then(({ data, error }) => {
      if (!error && data) setProjects(data as Project[]);
      setLoading(false);
    });
  }, []);

  const addProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').insert([{ ...projectData }]).select();
    if (!error && data) setProjects((prev) => [...prev, data[0] as Project]);
    setLoading(false);
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    setLoading(true);
    // Garante que o campo 'ativo' seja enviado explicitamente se existir
    const updateData = { ...projectData };
    if ('ativo' in projectData) {
      updateData.ativo = projectData.ativo;
    }
    const { data, error } = await supabase.from('projects').update(updateData).eq('id', id).select();
    if (!error && data) setProjects((prev) => prev.map(p => p.id === id ? { ...p, ...data[0] } : p));
    setLoading(false);
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) setProjects((prev) => prev.filter(p => p.id !== id));
    setLoading(false);
  };

  return (
    <ProjectsContext.Provider value={{ projects, loading, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}; 