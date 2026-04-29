const API_BASE_URL = window.FHNW_API_BASE_URL || "http://localhost:4000/api";

let authToken = localStorage.getItem("fhnwAuthToken") || "";

export function setAuthToken(token) {
  authToken = token;
  localStorage.setItem("fhnwAuthToken", token);
}

export function clearAuthToken() {
  authToken = "";
  localStorage.removeItem("fhnwAuthToken");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `API request failed: ${response.status}`);
  }
  return payload;
}

export const api = {
  health: () => request("/health"),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  students: () => request("/students"),
  createStudent: (body) => request("/students", { method: "POST", body: JSON.stringify(body) }),
  updateStudent: (id, body) => request(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  internships: () => request("/internships"),
  internship: (id) => request(`/internships/${id}`),
  createInternship: (body) => request("/internships", { method: "POST", body: JSON.stringify(body) }),
  apply: (body) => request("/applications", { method: "POST", body: JSON.stringify(body) }),
  studentApplications: (studentId) => request(`/applications/student/${studentId}`),
  updateApplicationStatus: (id, body) => request(`/applications/${id}/status`, { method: "PUT", body: JSON.stringify(body) }),
  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  recommendations: (studentId) => request(`/recommendations/${studentId}`),
};
