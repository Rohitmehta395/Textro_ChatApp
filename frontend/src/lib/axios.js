import axios from "axios";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
const defaultBaseUrl = import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (backendUrl ? `${backendUrl}/api` : defaultBaseUrl),
  withCredentials: true,
});
