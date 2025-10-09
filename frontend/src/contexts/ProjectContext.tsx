import React, { createContext, useContext, useState } from 'react';
import type { Project, ProjectCreate } from '../types';
import { projectAPI } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (data: ProjectCreate) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  // Simple state hooks instead of complex reducer
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projects = await projectAPI.getProjects();
      setProjects(projects);
    } catch (error) {
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (data: ProjectCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectAPI.createProject(data);
      const newProject = response.project; // API returns { project: ... }
      setProjects(prev => [...prev, newProject]);
    } catch (error) {
      setError('Failed to create project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      currentProject, 
      isLoading, 
      error, 
      fetchProjects, 
      createProject, 
      setCurrentProject 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
