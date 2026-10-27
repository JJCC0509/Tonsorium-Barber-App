import { apiRequest } from './apiClient';
import type { MeResponse, UpdateMeInput } from '../types/api';

/** GET /me */
export function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me');
}

/** PUT /me */
export function updateMe(input: UpdateMeInput): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me', { method: 'PUT', body: input });
}
