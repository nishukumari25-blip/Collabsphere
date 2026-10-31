import React, { createContext, useContext, useState, useCallback } from 'react';
import { projectService } from '../services/projectService';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [projectStats, setProjectStats] = useState({ notesCount: 0, filesCount: 0, membersCount: 0 });
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectError, setProjectError] = useState(null);

  const loadProject = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoadingProject(true);
    setProjectError(null);
    try {
      const res = await projectService.getProjectById(projectId);
      if (res.success && res.project) {
        setCurrentProject(res.project);
        setUserRole(res.userRole || 'VIEWER');
        if (res.stats) {
          setProjectStats(res.stats);
        }
      }
    } catch (err) {
      setProjectError(err.message || 'Failed to load project');
    } finally {
      setLoadingProject(false);
    }
  }, []);

  const clearProject = useCallback(() => {
    setCurrentProject(null);
    setUserRole(null);
    setProjectStats({ notesCount: 0, filesCount: 0, membersCount: 0 });
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        userRole,
        projectStats,
        loadingProject,
        projectError,
        loadProject,
        clearProject,
        setCurrentProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
