import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LeafCertificate } from '@web-ca/shared';
import { useApi } from '@/composables/useApi';

export const useCertificateStore = defineStore('certificate', () => {
  const certificates = ref<LeafCertificate[]>([]);
  const currentCert = ref<LeafCertificate | null>(null);
  const loading = ref(false);
  const api = useApi();

  async function fetchCertificates(caId?: string) {
    loading.value = true;
    try {
      const query = caId ? `?caId=${caId}` : '';
      certificates.value = await api.get<LeafCertificate[]>(`/certificates${query}`);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCertificate(id: string) {
    loading.value = true;
    try {
      currentCert.value = await api.get<LeafCertificate>(`/certificates/${id}`);
    } finally {
      loading.value = false;
    }
  }

  async function createCertificate(data: unknown) {
    return api.post<LeafCertificate>('/certificates', data);
  }

  async function renewCertificate(id: string, validityDays: number) {
    return api.post<LeafCertificate>(`/certificates/${id}/renew`, { validityDays });
  }

  async function deleteCertificate(id: string) {
    await api.del(`/certificates/${id}`);
    certificates.value = certificates.value.filter((c) => c.id !== id);
  }

  return { certificates, currentCert, loading, fetchCertificates, fetchCertificate, createCertificate, renewCertificate, deleteCertificate };
});
