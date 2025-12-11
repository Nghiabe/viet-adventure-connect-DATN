export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  accountType?: 'user' | 'partner';
};

export type LoginPayload = {
  email: string;
  password: string;
};

import apiClient from './apiClient';

export const authService = {
  async register(payload: RegisterPayload) {
    return apiClient.post('/auth/register', payload);
  },

  async login(payload: LoginPayload) {
    return apiClient.post('/auth/login', payload);
  },

  async logout() {
    return apiClient.post('/auth/logout', {});
  },

  async me() {
    return apiClient.get('/auth/me');
  },
};

export default authService;




