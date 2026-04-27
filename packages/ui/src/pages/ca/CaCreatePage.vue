<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NH2, useMessage } from 'naive-ui';
import CaForm from '@/components/ca/CaForm.vue';
import { useCaStore } from '@/stores/ca.store';

const router = useRouter();
const caStore = useCaStore();
const message = useMessage();
const loading = ref(false);

onMounted(() => caStore.fetchCas());

async function handleSubmit(data: any) {
  loading.value = true;
  try {
    await caStore.createCa(data);
    message.success('CA created successfully');
    router.push({ name: 'ca-list' });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Failed to create CA');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NH2>Create Certificate Authority</NH2>
  <NCard>
    <CaForm :parent-cas="caStore.cas" :loading="loading" @submit="handleSubmit" />
  </NCard>
</template>
