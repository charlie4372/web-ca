<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NCard, NH2, useMessage } from 'naive-ui';
import CertForm from '@/components/certificates/CertForm.vue';
import { useCaStore } from '@/stores/ca.store';
import { useCertificateStore } from '@/stores/certificate.store';

const router = useRouter();
const route = useRoute();
const caStore = useCaStore();
const certStore = useCertificateStore();
const message = useMessage();
const loading = ref(false);

const defaultCaId = (route.query.caId as string) || undefined;

onMounted(() => caStore.fetchCas());

async function handleSubmit(data: any) {
  loading.value = true;
  try {
    await certStore.createCertificate(data);
    message.success('Certificate created successfully');
    router.push({ name: 'cert-list' });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Failed to create certificate');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NH2>Create Certificate</NH2>
  <NCard>
    <CertForm :cas="caStore.cas" :loading="loading" :default-ca-id="defaultCaId" @submit="handleSubmit" />
  </NCard>
</template>
