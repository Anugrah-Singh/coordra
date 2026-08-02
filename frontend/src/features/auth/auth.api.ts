import { request } from '@/lib/api-client';
import type { User } from '@/types/api';

export const authApi = {
  me: () => request<{ user: User }>({ method: 'GET', url: '/api/auth/me' }),

  login: (input: { email: string; password: string }) =>
    request<{ user: User }>({
      method: 'POST',
      url: '/api/auth/login',
      data: input,
    }),

  register: (input: { email: string; password: string; fullName: string }) =>
    request<User>({
      method: 'POST',
      url: '/api/auth/register',
      data: input,
    }),

  logout: () => request<void>({ method: 'POST', url: '/api/auth/logout' }),
};
