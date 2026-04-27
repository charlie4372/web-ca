import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CaCertificate } from '@web-ca/shared';
import { useApi } from '@/composables/useApi';

export const useCaStore = defineStore('ca', () => {
  const cas = ref<CaCertificate[]>([]);
  const currentCa = ref<CaCertificate | null>(null);
  const loading = ref(false);
  const api = useApi();

  async function fetchCas() {
    loading.value = true;
    try {
      cas.value = await api.get<CaCertificate[]>('/cas');
    } finally {
      loading.value = false;
    }
  }

  async function fetchCa(id: string) {
    loading.value = true;
    try {
      currentCa.value = await api.get<CaCertificate>(`/cas/${id}`);
    } finally {
      loading.value = false;
    }
  }

  async function createCa(data: unknown) {
    return api.post<CaCertificate>('/cas', data);
  }

  async function uploadCa(data: unknown) {
    return api.post<CaCertificate>('/cas/upload', data);
  }

  async function renewCa(id: string, validityDays: number) {
    return api.post<CaCertificate>(`/cas/${id}/renew`, { validityDays });
  }

  async function deleteCa(id: string) {
    await api.del(`/cas/${id}`);
    cas.value = cas.value.filter((c) => c.id !== id);
  }

  return { cas, currentCa, loading, fetchCas, fetchCa, createCa, uploadCa, renewCa, deleteCa };
});
