import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Project {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

interface ProjectsContextType {
  projects: Project[];
  addProject: (projectData: Omit<Project, 'id'>) => void;
  deleteProject: (id: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

function logProjectAction(action: string, project: any) {
  const logs = JSON.parse(localStorage.getItem('rrz_logs') || '[]');
  logs.push({
    type: 'projeto',
    action,
    projectId: project.id,
    nome: project.nome,
    timestamp: new Date().toISOString(),
    user: localStorage.getItem('rrz_user') ? JSON.parse(localStorage.getItem('rrz_user')).email : 'desconhecido',
  });
  localStorage.setItem('rrz_logs', JSON.stringify(logs));
}

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const savedProjects = localStorage.getItem('rrz_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  const addProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('rrz_projects', JSON.stringify(updatedProjects));
    logProjectAction('criação', newProject);
  };

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter((p) => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('rrz_projects', JSON.stringify(updatedProjects));
    logProjectAction('exclusão', { id });
  };

  return (
    <ProjectsContext.Provider value={{ projects, addProject, deleteProject }}>
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