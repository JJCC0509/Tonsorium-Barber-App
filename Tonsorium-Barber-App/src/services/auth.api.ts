import type { AuthResponse } from '../types/api';
import { post } from './api';

export async function registerUser(input: {
  fullName: string;
  email: string;
  phone?: string;
  preferredShop: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', input);
}

export async function loginUser(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', input);
}
