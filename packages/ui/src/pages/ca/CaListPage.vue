<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace, NButton, NH2, NIcon, useMessage, useDialog } from 'naive-ui';
import { AddOutline, CloudUploadOutline } from '@vicons/ionicons5';
import { useCaStore } from '@/stores/ca.store';
import CaTable from '@/components/ca/CaTable.vue';

const router = useRouter();
const caStore = useCaStore();
const message = useMessage();
const dialog = useDialog();

onMounted(() => caStore.fetchCas());

function handleDelete(id: string) {
  dialog.warning({
    title: 'Delete CA',
    content: 'Are you sure? This will permanently delete this certificate authority and cannot be undone.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await caStore.deleteCa(id);
        message.success('CA deleted');
      } catch {
        message.error('Failed to delete CA');
      }
    },
  });
}
</script>

<template>
  <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
    <NH2 style="margin: 0">Certificate Authorities</NH2>
    <NSpace>
      <NButton type="primary" @click="router.push({ name: 'ca-create' })">
        <template #icon><NIcon><AddOutline /></NIcon></template>
        Create CA
      </NButton>
      <NButton @click="router.push({ name: 'ca-upload' })">
        <template #icon><NIcon><CloudUploadOutline /></NIcon></template>
        Upload CA
      </NButton>
    </NSpace>
  </NSpace>
  <CaTable :cas="caStore.cas" :loading="caStore.loading" @delete="handleDelete" />
</template>
