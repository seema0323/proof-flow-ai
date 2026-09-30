const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

async function readResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }

  return data;
}

async function fetchApi(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to reach the ProofFlow API. Check the server and API URL.");
    }
    throw error;
  }
}

export async function loginUser(email, password) {
  const response = await fetchApi(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return readResponse(response);
}

async function request(url, token, options = {}) {
  const response = await fetchApi(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return readResponse(response);
}

export function getProjectHealth(projectId, token) {
  return request(`/api/projects/${projectId}/health`, token);
}

export function getProjects(token) {
  return request("/api/projects", token);
}

export function getProjectMembers(projectId, token) {
  return request(`/api/projects/${projectId}/members`, token);
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
export function claimTaskCompletion(taskId, token) {
  return request(`/api/tasks/${taskId}/claim-complete`, token, {
    method: "PATCH",
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

  if (evidenceData.githubUrl) {
    formData.append("githubUrl", evidenceData.githubUrl);
  }

  if (evidenceData.deployedUrl) {
    formData.append("deployedUrl", evidenceData.deployedUrl);
  }

  if (evidenceData.file) {
    formData.append("file", evidenceData.file);
  }

  const response = await fetchApi(
    `${API_BASE_URL}/api/evidence`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return readResponse(response);
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
export function getProjectInsights(projectId, token) {
  return request(
    `/api/insights/${projectId}`,
    token
  );
}
export function getProjectReport(projectId, token) {
  return request(
    `/api/reports/${projectId}`,
    token
  );
}