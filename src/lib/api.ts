import Constants from 'expo-constants';
import { storage } from './storage';

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await storage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : await getAuthHeader();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.message || 'Erro na requisição', data);
  }

  return data as T;
}

export function createApiClient() {
  return {
    get: <T>(endpoint: string) => fetchApi<T>(endpoint),
    post: <T>(endpoint: string, body: unknown) =>
      fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body: unknown) =>
      fetchApi<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
  };
}
