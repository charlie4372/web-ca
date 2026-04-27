import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@web-ca/shared';
import { useApi } from '@/composables/useApi';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const loading = ref(false);
  const api = useApi();

  async function fetchUsers() {
    loading.value = true;
    try {
      users.value = await api.get<User[]>('/users');
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser(id: string) {
    loading.value = true;
    try {
      currentUser.value = await api.get<User>(`/users/${id}`);
    } finally {
      loading.value = false;
    }
  }

  async function createUser(data: unknown) {
    return api.post<User>('/users', data);
  }

  async function updateUser(id: string, data: unknown) {
    return api.patch<User>(`/users/${id}`, data);
  }

  async function changePassword(id: string, password: string) {
    await api.patch(`/users/${id}/password`, { password });
  }

  async function deleteUser(id: string) {
    await api.del(`/users/${id}`);
    users.value = users.value.filter((u) => u.id !== id);
  }

  return { users, currentUser, loading, fetchUsers, fetchUser, createUser, updateUser, changePassword, deleteUser };
});
