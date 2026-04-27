<script setup lang="ts">
import { h } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable, NButton, NSpace, NTag, NIcon } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { TrashOutline, EyeOutline } from '@vicons/ionicons5';
import type { LeafCertificate } from '@web-ca/shared';
import { format, isPast, differenceInDays } from 'date-fns';

defineProps<{ certificates: LeafCertificate[]; loading: boolean }>();
const emit = defineEmits<{ delete: [id: string] }>();
const router = useRouter();

const columns: DataTableColumns<LeafCertificate> = [
  { title: 'Name', key: 'name', ellipsis: { tooltip: true } },
  { title: 'Subject', key: 'subjectCn', ellipsis: { tooltip: true } },
  {
    title: 'SANs',
    key: 'sanEntries',
    width: 80,
    render: (row) => h(NTag, { size: 'small' }, { default: () => `${row.sanEntries.length}` }),
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (row) => {
      const expired = isPast(new Date(row.notAfter));
      const daysLeft = differenceInDays(new Date(row.notAfter), new Date());
      if (expired) return h(NTag, { size: 'small', type: 'error' }, { default: () => 'Expired' });
      if (daysLeft <= 30) return h(NTag, { size: 'small', type: 'warning' }, { default: () => `${daysLeft}d left` });
      return h(NTag, { size: 'small', type: 'success' }, { default: () => 'Active' });
    },
  },
  {
    title: 'Expires',
    key: 'notAfter',
    width: 140,
    render: (row) => format(new Date(row.notAfter), 'PP'),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (row) =>
      h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => router.push({ name: 'cert-detail', params: { id: row.id } }) }, {
            icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
          }),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => emit('delete', row.id) }, {
            icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
          }),
        ],
      }),
  },
];
</script>

<template>
  <NDataTable :columns="columns" :data="certificates" :loading="loading" :bordered="true" size="small" />
</template>
