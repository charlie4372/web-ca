<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace, NButton, NH2, NIcon, useMessage, useDialog } from 'naive-ui';
import { AddOutline } from '@vicons/ionicons5';
import { useCertificateStore } from '@/stores/certificate.store';
import CertTable from '@/components/certificates/CertTable.vue';

const router = useRouter();
const certStore = useCertificateStore();
const message = useMessage();
const dialog = useDialog();

onMounted(() => certStore.fetchCertificates());

function handleDelete(id: string) {
  dialog.warning({
    title: 'Delete Certificate',
    content: 'Are you sure? This will permanently delete this certificate.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await certStore.deleteCertificate(id);
        message.success('Certificate deleted');
      } catch {
        message.error('Failed to delete certificate');
      }
    },
  });
}
</script>

<template>
  <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
    <NH2 style="margin: 0">Certificates</NH2>
    <NButton type="primary" @click="router.push({ name: 'cert-create' })">
      <template #icon><NIcon><AddOutline /></NIcon></template>
      Create Certificate
    </NButton>
  </NSpace>
  <CertTable :certificates="certStore.certificates" :loading="certStore.loading" @delete="handleDelete" />
</template>
