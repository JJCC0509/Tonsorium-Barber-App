import { apiRequest } from './apiClient';
import type { AuthResponse, LoginInput, RegisterInput } from '../types/api';

/** POST /auth/login */
export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input });
}

/** POST /auth/register */
export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input });
}
