import axios, { AxiosError, AxiosInstance } from "axios";

import { env } from "../utils/env";

type ApiClientConfig = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
};

let api: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!api) {
    api = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: 30_000,
    });
  }
  return api;
}

export function configureApiClient(config: ApiClientConfig): void {
  const client = getApiClient();

  client.interceptors.request.use((req) => {
    const token = config.getAccessToken();
    if (token) {
      req.headers = req.headers ?? {};
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        config.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );
}

