import { Platform } from 'react-native';

const LOCAL_HOST =
  Platform.OS === 'android' ? 'http://100.69.248.49:8080/api' : 'http://100.69.248.49:8080/api';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? LOCAL_HOST;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = init.method ?? 'GET';
  console.log(`[API] ${method} ${url}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    console.error(`[API] ${method} ${url} — network error:`, e);
    throw new ApiError(`Could not reach the server at ${url}`, 0);
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = body?.error ?? `Request failed (${res.status})`;
    console.warn(`[API] ${method} ${url} → ${res.status}: ${message}`);
    throw new ApiError(message, res.status);
  }

  console.log(`[API] ${method} ${url} → ${res.status}`);
  return body as T;
}
