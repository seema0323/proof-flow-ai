import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [selectedProjectId, setSelectedProjectId] =
    useState(() => {
      return localStorage.getItem("proofFlowProjectId") || "";
    });

  function selectProject(projectId) {
    if (!projectId) return;

    setSelectedProjectId(projectId);
    localStorage.setItem(
      "proofFlowProjectId",
      projectId
    );
  }

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(
        "proofFlowProjectId",
        selectedProjectId
      );
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