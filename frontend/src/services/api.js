const API_BASE_URL = "http://localhost:5000";

async function request(url, token) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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

export function getTasks(projectId, token) {
  return request(`/api/tasks/${projectId}`, token);
}