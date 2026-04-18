import { apiFetch } from './api';

export type AuthResponse = {
  id: number;
  email: string;
  token: string;
};

export function registerAccount(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
