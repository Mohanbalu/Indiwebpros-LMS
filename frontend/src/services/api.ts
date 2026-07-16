import axios from "axios";
import { APP_CONFIG } from "@/config/app.config";
import { AXIOS_CONFIG } from "@/config/axios.config";

export const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: AXIOS_CONFIG.timeout,
  headers: AXIOS_CONFIG.headers,
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Placeholder: Handle global network or token refresh errors
    return Promise.reject(error);
  }
);
