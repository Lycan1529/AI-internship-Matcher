const API_BASE_URL = window.FHNW_API_BASE_URL;

function abortAfter(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(timer),
  };
}

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
  const isFormData = options.body instanceof FormData;
  const timeout = abortAfter();
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: timeout.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.error || `API request failed: ${response.status}`);
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The backend is not responding. Make sure the local API on port 4000 is running.");
    }
    throw error;
  } finally {
    timeout.cancel();
  }
}

export const api = {
  health: () => request("/health"),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  studentMe: () => request("/students/me"),
  students: () => request("/students"),
  createStudent: (body) => request("/students", { method: "POST", body: JSON.stringify(body) }),
  updateStudent: (id, body) => request(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  recruiterMe: () => request("/recruiters/me"),
  recruiters: () => request("/recruiters"),
  createRecruiter: (body) => request("/recruiters", { method: "POST", body: JSON.stringify(body) }),
  companies: () => request("/companies"),
  createCompany: (body) => request("/companies", { method: "POST", body: JSON.stringify(body) }),
  updateCompany: (id, body) => request(`/companies/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  internships: () => request("/internships"),
  internship: (id) => request(`/internships/${id}`),
  createInternship: (body) => request("/internships", { method: "POST", body: JSON.stringify(body) }),
  updateInternship: (id, body) => request(`/internships/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  applications: () => request("/applications"),
  apply: (body) => request("/applications", { method: "POST", body: JSON.stringify(body) }),
  studentApplications: (studentId) => request(`/applications/student/${studentId}`),
  recruiterApplications: (recruiterId) => request(`/applications/recruiter/${recruiterId}`),
  updateApplicationStatus: (id, body) => request(`/applications/${id}/status`, { method: "PUT", body: JSON.stringify(body) }),
  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  recommendations: (studentId) => request(`/recommendations/${studentId}`),
  uploadCv: (file) => {
    const form = new FormData();
    form.append("cv", file);
    return request("/cv/upload", { method: "POST", body: form });
  },
  parseCv: (file) => {
    const form = new FormData();
    form.append("cv", file);
    return request("/cv/parse", { method: "POST", body: form });
  },
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return request("/profile/avatar", { method: "POST", body: form });
  },
  adminStats: () => request("/admin/stats"),
  adminSources: () => request("/admin/sources"),
  adminAnalytics: () => request("/admin/analytics"),
};
