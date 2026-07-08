import axios from "axios";

const defaultApiUrl =
  typeof window === "undefined"
    ? "http://localhost:8000/api"
    : `${window.location.protocol}//${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultApiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("barbearia_mdm_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("barbearia_mdm_access_token");
    }
    return Promise.reject(error);
  },
);

export default api;
