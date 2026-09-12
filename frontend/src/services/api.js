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