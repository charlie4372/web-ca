<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  NCard, NDescriptions, NDescriptionsItem, NSpace, NButton, NTag, NH2,
  NModal, NForm, NFormItem, NInputNumber, useMessage, useDialog, NIcon
} from 'naive-ui';
import { TrashOutline, RefreshOutline, DownloadOutline, AddOutline } from '@vicons/ionicons5';
import { useCaStore } from '@/stores/ca.store';
import { useCertificateStore } from '@/stores/certificate.store';
import CertTable from '@/components/certificates/CertTable.vue';
import { format } from 'date-fns';
import { useApi } from '@/composables/useApi';

const props = defineProps<{ id: string }>();
const router = useRouter();
const caStore = useCaStore();
const certStore = useCertificateStore();
const message = useMessage();
const dialog = useDialog();
const api = useApi();

const showRenewModal = ref(false);
const renewDays = ref(3650);
const renewLoading = ref(false);

onMounted(async () => {
  await Promise.all([caStore.fetchCa(props.id), certStore.fetchCertificates(props.id)]);
});

async function handleRenew() {
  renewLoading.value = true;
  try {
    const renewed = await caStore.renewCa(props.id, renewDays.value);
    message.success('CA renewed successfully');
    showRenewModal.value = false;
    router.push({ name: 'ca-detail', params: { id: renewed.id } });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Failed to renew CA');
  } finally {
    renewLoading.value = false;
  }
}

function handleDelete() {
  dialog.warning({
    title: 'Delete CA',
    content: 'This will permanently delete this CA and cannot be undone. Certificates issued by this CA will become orphaned.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await caStore.deleteCa(props.id);
        message.success('CA deleted');
        router.push({ name: 'ca-list' });
      } catch {
        message.error('Failed to delete CA');
      }
    },
  });
}

function handleDownload() {
  window.open(api.downloadUrl(`/cas/${props.id}/download`), '_blank');
}

function handleDeleteCert(id: string) {
  dialog.warning({
    title: 'Delete Certificate',
    content: 'Are you sure you want to delete this certificate?',
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
  <template v-if="caStore.currentCa">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <NH2 style="margin: 0">{{ caStore.currentCa.name }}</NH2>
      <NSpace>
        <NButton @click="handleDownload">
          <template #icon><NIcon><DownloadOutline /></NIcon></template>
          Download
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
        <NDescriptionsItem label="Subject CN">{{ caStore.currentCa.subjectCn }}</NDescriptionsItem>
        <NDescriptionsItem label="Organization">{{ caStore.currentCa.subjectOrg }}</NDescriptionsItem>
        <NDescriptionsItem label="Key Algorithm">
          <NTag size="small" type="info">{{ caStore.currentCa.keyAlgorithm }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="Type">
          <NTag size="small" :type="caStore.currentCa.isUploaded ? 'warning' : 'success'">
            {{ caStore.currentCa.isUploaded ? 'Uploaded' : 'Generated' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="Valid From">{{ format(new Date(caStore.currentCa.notBefore), 'PPP') }}</NDescriptionsItem>
        <NDescriptionsItem label="Valid Until">{{ format(new Date(caStore.currentCa.notAfter), 'PPP') }}</NDescriptionsItem>
        <NDescriptionsItem label="Serial Number">
          <code>{{ caStore.currentCa.serialNumber }}</code>
        </NDescriptionsItem>
        <NDescriptionsItem label="SHA-256 Fingerprint">
          <code style="word-break: break-all; font-size: 12px">{{ caStore.currentCa.fingerprintSha256 }}</code>
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <h3 style="margin: 0">Issued Certificates</h3>
      <NButton type="primary" @click="router.push({ name: 'cert-create', query: { caId: id } })">
        <template #icon><NIcon><AddOutline /></NIcon></template>
        New Certificate
      </NButton>
    </NSpace>
    <CertTable :certificates="certStore.certificates" :loading="certStore.loading" @delete="handleDeleteCert" />
  </template>

  <NModal v-model:show="showRenewModal" title="Renew CA" preset="dialog">
    <NForm>
      <NFormItem label="Validity (days)">
        <NInputNumber v-model:value="renewDays" :min="1" :max="36500" style="width: 100%" />
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
