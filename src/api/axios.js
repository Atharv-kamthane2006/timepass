import axios from "axios";
import { useAppStore } from "../store/useAppStore";

// Environment Variable approach for Vercel & general deployment
const API_URL = import.meta.env.VITE_API_URL || "https://olivaceous-shaunte-indeterminedly.ngrok-free.dev";
const DEFAULT_TIMEOUT_MS = 12_000;

const API = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
});

// 🔥 IMPORTANT FIX FOR NGROK + CORS awareness
API.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

// Global Error Handling Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = "An unexpected error occurred.";

    // Determine context or reason for failure
    if (!error.response) {
      errorMessage = "Network error or CORS issue. Backend might be down.";
      console.error("🔥 [Global API Error] Network or CORS Issue:", error.message);
    } else {
      const detail = error.response.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        errorMessage = JSON.stringify(detail);
      } else {
        errorMessage = error.message;
      }
      console.error(`🔥 [Global API Error] ${error.response.status} - ${errorMessage}`);
    }
    
    // Dispatch to global store to prevent blank screens and show message in UI
    if (useAppStore?.getState) {
      useAppStore.getState().setError(String(errorMessage));
    }
    
    // Continue to throw so components can handle specific states,
    // but at least we've logged it globally
    return Promise.reject(error);
  }
);

export default API;
