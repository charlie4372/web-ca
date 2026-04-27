<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NH2, useMessage } from 'naive-ui';
import CaUploadForm from '@/components/ca/CaUploadForm.vue';
import { useCaStore } from '@/stores/ca.store';

const router = useRouter();
const caStore = useCaStore();
const message = useMessage();
const loading = ref(false);

async function handleSubmit(data: any) {
  loading.value = true;
  try {
    await caStore.uploadCa(data);
    message.success('CA uploaded successfully');
    router.push({ name: 'ca-list' });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Failed to upload CA');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NH2>Upload Certificate Authority</NH2>
  <NCard>
    <CaUploadForm :loading="loading" @submit="handleSubmit" />
  </NCard>
</template>
