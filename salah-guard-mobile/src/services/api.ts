/**
 * Axios-based API client with JWT token refresh interceptor,
 * retry logic with exponential backoff, and timeout handling.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  ApiResponse,
  AuthTokenResponse,
  DndSession,
  DndSessionCreate,
  PaginatedResponse,
  Prayer,
  PrayerUpdatePayload,
  UserSettings,
} from '../types';
import { getTokens, storeTokens, clearTokens } from '../utils/secureStorage';
import { getApiUrl, getDeviceId } from '../utils/storage';
import logger from '../utils/logger';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

function getBaseUrl(): string {
  return getApiUrl() ?? 'http://10.93.37.139:5000';
}

let apiClient: AxiosInstance | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: attach access token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // Response interceptor: handle 401 with token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const tokens = await getTokens();
          const deviceId = getDeviceId();

          if (!tokens?.refreshToken || !deviceId) {
            await clearTokens();
            processQueue(new Error('No refresh token'), null);
            return Promise.reject(error);
          }

          const response = await axios.post<ApiResponse<AuthTokenResponse>>(
            `${getBaseUrl()}/api/auth/refresh`,
            {
              refreshToken: tokens.refreshToken,
              deviceId,
            },
          );

          if (response.data.success && response.data.data) {
            const newTokens = response.data.data;
            await storeTokens({
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
            });

            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            processQueue(null, newTokens.accessToken);
            return client(originalRequest);
          }

          processQueue(new Error('Token refresh failed'), null);
          return Promise.reject(error);
        } catch (refreshError) {
          await clearTokens();
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

function getClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = createClient();
  }
  return apiClient;
}

/**
 * Resets the API client (used when API URL changes).
 */
export function resetApiClient(): void {
  apiClient = null;
}

/**
 * Wraps an API call with retry logic and exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<AxiosResponse<ApiResponse<T>>>,
  retries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fn();
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'API request failed');
    } catch (err) {
      lastError = err;
      const axiosErr = err as AxiosError;

      // Don't retry client errors (4xx) except 408 and 429
      if (
        axiosErr.response &&
        axiosErr.response.status >= 400 &&
        axiosErr.response.status < 500 &&
        axiosErr.response.status !== 408 &&
        axiosErr.response.status !== 429
      ) {
        throw err;
      }

      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        logger.info(`Retrying request (attempt ${attempt + 1}/${retries}) after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// --- Auth API ---

export async function registerDevice(deviceId: string): Promise<AuthTokenResponse> {
  const response = await axios.post<ApiResponse<AuthTokenResponse>>(
    `${getBaseUrl()}/api/auth/register`,
    { deviceId },
    { timeout: DEFAULT_TIMEOUT },
  );
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message);
}

// --- Prayers API ---

export async function fetchPrayers(): Promise<Prayer[]> {
  return withRetry(() => getClient().get<ApiResponse<Prayer[]>>('/api/prayers'));
}

export async function updatePrayer(id: number, data: PrayerUpdatePayload): Promise<Prayer> {
  return withRetry(() =>
    getClient().put<ApiResponse<Prayer>>(`/api/prayers/${id}`, data),
  );
}

export async function createPrayer(data: PrayerUpdatePayload): Promise<Prayer> {
  return withRetry(() =>
    getClient().post<ApiResponse<Prayer>>('/api/prayers', data),
  );
}

// --- History API ---

export async function fetchHistory(
  page: number = 1,
  pageSize: number = 20,
  prayerName?: string,
): Promise<PaginatedResponse<DndSession>> {
  const params: Record<string, string | number> = { page, pageSize };
  if (prayerName) params.prayerName = prayerName;

  return withRetry(() =>
    getClient().get<ApiResponse<PaginatedResponse<DndSession>>>('/api/history', { params }),
  );
}

export async function logDndSession(data: DndSessionCreate): Promise<DndSession> {
  return withRetry(() =>
    getClient().post<ApiResponse<DndSession>>('/api/history', data),
  );
}

// --- Settings API ---

export async function fetchSettings(): Promise<UserSettings> {
  return withRetry(() =>
    getClient().get<ApiResponse<UserSettings>>('/api/settings'),
  );
}

export async function updateSettings(data: UserSettings): Promise<UserSettings> {
  return withRetry(() =>
    getClient().put<ApiResponse<UserSettings>>('/api/settings', data),
  );
}
