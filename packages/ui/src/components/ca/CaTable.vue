<script setup lang="ts">
import { h } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable, NButton, NSpace, NTag, NIcon } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { TrashOutline, EyeOutline } from '@vicons/ionicons5';
import type { CaCertificate } from '@web-ca/shared';
import { format, isPast } from 'date-fns';

defineProps<{ cas: CaCertificate[]; loading: boolean }>();
const emit = defineEmits<{ delete: [id: string] }>();
const router = useRouter();

const columns: DataTableColumns<CaCertificate> = [
  { title: 'Name', key: 'name', ellipsis: { tooltip: true } },
  { title: 'Subject CN', key: 'subjectCn', ellipsis: { tooltip: true } },
  {
    title: 'Algorithm',
    key: 'keyAlgorithm',
    width: 120,
    render: (row) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.keyAlgorithm }),
  },
  {
    title: 'Status',
    key: 'status',
    width: 100,
    render: (row) => {
      const expired = isPast(new Date(row.notAfter));
      return h(NTag, { size: 'small', type: expired ? 'error' : 'success' }, { default: () => expired ? 'Expired' : 'Active' });
    },
  },
  {
    title: 'Expires',
    key: 'notAfter',
    width: 140,
    render: (row) => format(new Date(row.notAfter), 'PP'),
  },
  {
    title: 'Type',
    key: 'isUploaded',
    width: 110,
    render: (row) => h(NTag, { size: 'small', type: row.isUploaded ? 'warning' : 'default' }, { default: () => row.isUploaded ? 'Uploaded' : 'Generated' }),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (row) =>
      h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, onClick: () => router.push({ name: 'ca-detail', params: { id: row.id } }) }, {
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
  <NDataTable :columns="columns" :data="cas" :loading="loading" :bordered="true" size="small" />
</template>
