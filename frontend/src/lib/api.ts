/// <reference types="vite/client" />
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true, // Important for sending cookies
});

api.interceptors.request.use((config) => {
  // Token is now in HTTP-only cookie, so no need to set Authorization header
  // The browser will automatically send the cookie with each request
  return config;
});

export default api;
