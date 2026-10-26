
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.slice(name.length + 1))
    : "";
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const csrfToken = getCookie("csrfToken");

    if (csrfToken) {
      config.headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const isLoginRequest = /\/auth\/login(?:\?|$)/.test(url);
    const isSessionCheck = /\/auth\/me(?:\?|$)/.test(url);

    if (
      status === 401 &&
      !isLoginRequest &&
      !isSessionCheck
    ) {
      window.dispatchEvent(
        new CustomEvent("auth:session-expired"),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
