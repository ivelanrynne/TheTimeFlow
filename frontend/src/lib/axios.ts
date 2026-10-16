import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api",
  withCredentials: true,
});

// Add a request interceptor to include the access token in the headers
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Add a response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (res) => res,
    async (error) => {
        const originalRequest = error.config;

        if (
            originalRequest.url.includes("/auth/refresh") ||
            originalRequest.url.includes("/auth/signin") ||
            originalRequest.url.includes("/auth/signup")
        ) {
            // If the error is a 401 and the request is not for the refresh endpoint, try to refresh the token
            return Promise.reject(error);
        }

        originalRequest._retryCount = originalRequest._retryCount || 0;
      
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          originalRequest._retryCount < 5
        ) {
          originalRequest._retryCount += 1;

          console.log(
            "Access token expired. Attempting to refresh token... Retry count:",
            originalRequest._retryCount,
          );

          try {
            const res = await api.post("/auth/refresh", null, {
              withCredentials: true,
            });
            const newAccessToken = res.data.accessToken;

            useAuthStore.getState().setAccessToken(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            useAuthStore.getState().clearState();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
    }
);

export default api;
