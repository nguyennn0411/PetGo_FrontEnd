import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/verify-otp",
      "/auth/resend-otp",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh",
    ];
    const isPublic = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

    if (!isPublic) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response) {
      return Promise.reject({
        response: {
          data: {
            message: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
          },
        },
      });
    }

    const noRetryEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/verify-otp",
      "/auth/resend-otp",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh",
      "/auth/logout",
    ];

    if (noRetryEndpoints.some((url) => config.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !config._retry) {
      config._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("account");
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const refreshResult = refreshResponse.data?.result || refreshResponse.data || {};
        const nextToken = refreshResult.token;
        const nextRefreshToken = refreshResult.refreshToken;
        const nextAccount = refreshResult.user || refreshResult.account;

        if (nextToken) localStorage.setItem("token", nextToken);
        if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
        if (nextAccount) localStorage.setItem("account", JSON.stringify(nextAccount));

        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${nextToken}`;
        return api(config);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("account");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
