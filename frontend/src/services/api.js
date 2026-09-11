const API_BASE_URL = "http://localhost:5000";

export async function getProjectHealth(projectId, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/health`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}