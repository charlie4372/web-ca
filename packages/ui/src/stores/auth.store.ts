import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@web-ca/shared';
import { useApi } from '@/composables/useApi';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const api = useApi();

  const isAdmin = computed(() => user.value?.role === 'admin');
  const isAuthenticated = computed(() => !!user.value);

  async function login(email: string, password: string) {
    user.value = await api.post<User>('/auth/login', { email, password });
  }

  async function logout() {
    await api.post('/auth/logout');
    user.value = null;
  }

  async function fetchMe() {
    user.value = await api.get<User>('/auth/me');
  }

  return { user, isAdmin, isAuthenticated, login, logout, fetchMe };
});
