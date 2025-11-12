import axios from "axios";
import { useAuthStore } from "../../lib/store/auth";

export const API_URL = "https://hangry-backend.onrender.com";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  (config.headers as any)["Content-Type"] = "application/json";

  const url = config.url || "";
  const skipAuth = url.includes("/api/user/login") || url.includes("/api/user/register");

  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) (config.headers as any).token = token; // backend đọc header 'token'
  }
  return config;
});

export default client;
