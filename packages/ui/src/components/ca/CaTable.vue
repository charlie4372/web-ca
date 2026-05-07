<script setup lang="ts">
import { h } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable, NButton, NTag, NIcon } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { TrashOutline } from '@vicons/ionicons5';
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
    title: '',
    key: 'actions',
    width: 50,
    render: (row) =>
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: (e: Event) => { e.stopPropagation(); emit('delete', row.id); },
      }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
  },
];

function handleRowClick(row: CaCertificate) {
  router.push({ name: 'ca-detail', params: { id: row.id } });
}
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="cas"
    :loading="loading"
    :bordered="true"
    size="small"
    :row-props="(row: CaCertificate) => ({ style: 'cursor: pointer', onClick: () => handleRowClick(row) })"
  />
</template>
