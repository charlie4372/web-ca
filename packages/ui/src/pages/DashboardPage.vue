<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NGrid, NGi, NCard, NStatistic, NDataTable, NH2 } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useCaStore } from '@/stores/ca.store';
import { useCertificateStore } from '@/stores/certificate.store';
import type { LeafCertificate } from '@web-ca/shared';
import { format, differenceInDays, isPast } from 'date-fns';

const router = useRouter();
const caStore = useCaStore();
const certStore = useCertificateStore();
const loading = ref(true);

onMounted(async () => {
  await Promise.all([caStore.fetchCas(), certStore.fetchCertificates()]);
  loading.value = false;
});

const expiringSoon = computed(() => {
  const now = new Date();
  return certStore.certificates.filter((c) => {
    const daysLeft = differenceInDays(new Date(c.notAfter), now);
    return daysLeft >= 0 && daysLeft <= 30;
  });
});

const expired = computed(() => {
  return certStore.certificates.filter((c) => isPast(new Date(c.notAfter)));
});

const expiringColumns: DataTableColumns<LeafCertificate> = [
  { title: 'Name', key: 'name' },
  { title: 'Subject', key: 'subjectCn' },
  {
    title: 'Expires',
    key: 'notAfter',
    render: (row) => format(new Date(row.notAfter), 'PPP'),
  },
  {
    title: 'Days Left',
    key: 'daysLeft',
    render: (row) => {
      const days = differenceInDays(new Date(row.notAfter), new Date());
      return days <= 0 ? 'Expired' : `${days} days`;
    },
  },
];

function handleCertRowClick(row: LeafCertificate) {
  router.push({ name: 'cert-detail', params: { id: row.id } });
}
</script>

<template>
  <NH2>Dashboard</NH2>
  <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 24px">
    <NGi>
      <NCard hoverable style="cursor: pointer" @click="router.push({ name: 'ca-list' })">
        <NStatistic label="Certificate Authorities" :value="caStore.cas.length" />
      </NCard>
    </NGi>
    <NGi>
      <NCard hoverable style="cursor: pointer" @click="router.push({ name: 'cert-list' })">
        <NStatistic label="Certificates" :value="certStore.certificates.length" />
      </NCard>
    </NGi>
    <NGi>
      <NCard hoverable style="cursor: pointer" @click="router.push({ name: 'cert-list' })">
        <NStatistic label="Expiring Soon (30d)" :value="expiringSoon.length" />
      </NCard>
    </NGi>
    <NGi>
      <NCard hoverable style="cursor: pointer" @click="router.push({ name: 'cert-list' })">
        <NStatistic label="Expired" :value="expired.length" />
      </NCard>
    </NGi>
  </NGrid>

  <NCard title="Certificates Expiring Soon" v-if="expiringSoon.length > 0" style="margin-bottom: 24px">
    <NDataTable
      :columns="expiringColumns"
      :data="expiringSoon"
      :loading="loading"
      size="small"
      :row-props="(row: LeafCertificate) => ({ style: 'cursor: pointer', onClick: () => handleCertRowClick(row) })"
    />
  </NCard>

  <NCard title="Expired Certificates" v-if="expired.length > 0">
    <NDataTable
      :columns="expiringColumns"
      :data="expired"
      :loading="loading"
      size="small"
      :row-props="(row: LeafCertificate) => ({ style: 'cursor: pointer', onClick: () => handleCertRowClick(row) })"
    />
  </NCard>
</template>
