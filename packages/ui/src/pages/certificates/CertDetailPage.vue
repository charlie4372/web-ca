<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  NCard, NDescriptions, NDescriptionsItem, NSpace, NButton, NTag, NH2,
  NModal, NForm, NFormItem, NInputNumber, useMessage, useDialog, NIcon
} from 'naive-ui';
import { TrashOutline, RefreshOutline, DownloadOutline } from '@vicons/ionicons5';
import { useCertificateStore } from '@/stores/certificate.store';
import { format } from 'date-fns';
import { useApi } from '@/composables/useApi';

const props = defineProps<{ id: string }>();
const router = useRouter();
const certStore = useCertificateStore();
const message = useMessage();
const dialog = useDialog();
const api = useApi();

const showRenewModal = ref(false);
const renewDays = ref(365);
const renewLoading = ref(false);

onMounted(() => certStore.fetchCertificate(props.id));

const cert = computed(() => certStore.currentCert);

async function handleRenew() {
  renewLoading.value = true;
  try {
    const renewed = await certStore.renewCertificate(props.id, renewDays.value);
    message.success('Certificate renewed');
    showRenewModal.value = false;
    router.push({ name: 'cert-detail', params: { id: renewed.id } });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Failed to renew');
  } finally {
    renewLoading.value = false;
  }
}

function handleDelete() {
  dialog.warning({
    title: 'Delete Certificate',
    content: 'This will permanently delete this certificate.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await certStore.deleteCertificate(props.id);
        message.success('Certificate deleted');
        router.push({ name: 'cert-list' });
      } catch {
        message.error('Failed to delete');
      }
    },
  });
}

function handleDownload() {
  window.open(api.downloadUrl(`/certificates/${props.id}/download`), '_blank');
}
</script>

<template>
  <template v-if="cert">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <NH2 style="margin: 0">{{ cert.name }}</NH2>
      <NSpace>
        <NButton @click="handleDownload">
          <template #icon><NIcon><DownloadOutline /></NIcon></template>
          Download Bundle
        </NButton>
        <NButton type="info" @click="showRenewModal = true">
          <template #icon><NIcon><RefreshOutline /></NIcon></template>
          Renew
        </NButton>
        <NButton type="error" @click="handleDelete">
          <template #icon><NIcon><TrashOutline /></NIcon></template>
          Delete
        </NButton>
      </NSpace>
    </NSpace>

    <NCard style="margin-bottom: 24px">
      <NDescriptions label-placement="left" bordered :column="2">
        <NDescriptionsItem label="Subject CN">{{ cert.subjectCn }}</NDescriptionsItem>
        <NDescriptionsItem label="Key Algorithm">
          <NTag size="small" type="info">{{ cert.keyAlgorithm }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="Valid From">{{ format(new Date(cert.notBefore), 'PPP') }}</NDescriptionsItem>
        <NDescriptionsItem label="Valid Until">{{ format(new Date(cert.notAfter), 'PPP') }}</NDescriptionsItem>
        <NDescriptionsItem label="Serial Number">
          <code>{{ cert.serialNumber }}</code>
        </NDescriptionsItem>
        <NDescriptionsItem label="SHA-256 Fingerprint">
          <code style="word-break: break-all; font-size: 12px">{{ cert.fingerprintSha256 }}</code>
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="Subject Alternative Names" style="margin-bottom: 24px">
      <NSpace>
        <NTag v-for="(san, i) in cert.sanEntries" :key="i" type="info">
          {{ san.type.toUpperCase() }}: {{ san.value }}
        </NTag>
      </NSpace>
    </NCard>

    <NCard title="Key Usage">
      <NSpace>
        <NTag v-for="ku in cert.keyUsage" :key="ku" size="small">{{ ku }}</NTag>
        <NTag v-for="eku in cert.extKeyUsage" :key="eku" size="small" type="warning">{{ eku }}</NTag>
      </NSpace>
    </NCard>
  </template>

  <NModal v-model:show="showRenewModal" title="Renew Certificate" preset="dialog">
    <NForm>
      <NFormItem label="Validity (days)">
        <NInputNumber v-model:value="renewDays" :min="1" :max="825" style="width: 100%" />
      </NFormItem>
    </NForm>
    <template #action>
      <NSpace>
        <NButton @click="showRenewModal = false">Cancel</NButton>
        <NButton type="primary" :loading="renewLoading" @click="handleRenew">Renew</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
