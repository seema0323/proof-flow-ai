const API_BASE_URL = "http://localhost:5000";

async function request(url, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

export function getProjectHealth(projectId, token) {
  return request(`/api/projects/${projectId}/health`, token);
}

export function getProjects(token) {
  return request("/api/projects", token);
}

export function createProject(projectData, token) {
  return request("/api/projects", token, {
    method: "POST",
    body: JSON.stringify(projectData),
  });
}
export function createTask(taskData, token) {
  return request("/api/tasks", token, {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}
export function updateTaskStatus(taskId, status, token) {
  return request(`/api/tasks/${taskId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
export function getTasks(projectId, token) {
  return request(`/api/tasks/${projectId}`, token);
}

export function getGitHubCommits(projectId, token) {
  return request(`/api/github/${projectId}/commits`, token);
}

export function getGitHubContributors(projectId, token) {
  return request(`/api/github/${projectId}/contributors`, token);
}
export function getEvidence(taskId, token) {
  return request(`/api/evidence/${taskId}`, token);
}

export async function submitEvidence(evidenceData, token) {
  const formData = new FormData();

  formData.append("taskId", evidenceData.taskId);
  formData.append("description", evidenceData.description);

  if (evidenceData.githubCommitSha) {
    formData.append(
      "githubCommitSha",
      evidenceData.githubCommitSha
    );
  }

  if (evidenceData.deployedUrl) {
    formData.append("deployedUrl", evidenceData.deployedUrl);
  }

  if (evidenceData.file) {
    formData.append("file", evidenceData.file);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/evidence`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit evidence");
  }

  return data;
}

export function autoVerifyEvidence(evidenceId, token) {
  return request(`/api/github/evidence/${evidenceId}/auto-verify`, token, {
    method: "PATCH",
  });
}
export function verifyEvidenceWithAI(evidenceId, token) {
  return request(
    `/api/ai/verify-evidence/${evidenceId}`,
    token,
    {
      method: "PATCH",
    }
  );
}