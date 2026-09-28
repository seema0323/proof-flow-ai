import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [selectedProjectId, setSelectedProjectId] =
    useState(() => {
      return localStorage.getItem("proofFlowProjectId") || "";
    });

  const selectProject = useCallback((projectId) => {
    const nextProjectId = projectId || "";
    setSelectedProjectId(nextProjectId);
    if (nextProjectId) {
      localStorage.setItem("proofFlowProjectId", nextProjectId);
    } else {
      localStorage.removeItem("proofFlowProjectId");
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(
        "proofFlowProjectId",
        selectedProjectId
      );
    } else {
      localStorage.removeItem("proofFlowProjectId");
    }
  }, [selectedProjectId]);

  return (
    <ProjectContext.Provider
      value={{
        selectedProjectId,
        selectProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProject must be used inside ProjectProvider"
    );
  }

  return context;
}