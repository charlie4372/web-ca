<script setup lang="ts">
import { h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NSpace, NButton, NH2, NIcon, NDataTable, NTag, useMessage, useDialog } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { AddOutline, TrashOutline } from '@vicons/ionicons5';
import { useUserStore } from '@/stores/user.store';
import type { User } from '@web-ca/shared';
import { format } from 'date-fns';

const router = useRouter();
const userStore = useUserStore();
const message = useMessage();
const dialog = useDialog();

onMounted(() => userStore.fetchUsers());

const columns: DataTableColumns<User> = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  {
    title: 'Role',
    key: 'role',
    width: 120,
    render: (row) => h(NTag, { size: 'small', type: row.role === 'admin' ? 'warning' : 'default' }, { default: () => row.role }),
  },
  {
    title: 'Status',
    key: 'isActive',
    width: 100,
    render: (row) => h(NTag, { size: 'small', type: row.isActive ? 'success' : 'error' }, { default: () => row.isActive ? 'Active' : 'Inactive' }),
  },
  {
    title: 'Created',
    key: 'createdAt',
    width: 140,
    render: (row) => format(new Date(row.createdAt), 'PP'),
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
        onClick: (e: Event) => { e.stopPropagation(); handleDelete(row.id); },
      }, { icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }),
  },
];

function handleDelete(id: string) {
  dialog.warning({
    title: 'Delete User',
    content: 'Are you sure? This will permanently delete this user.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await userStore.deleteUser(id);
        message.success('User deleted');
      } catch (err: any) {
        message.error(err?.data?.error?.message || 'Failed to delete user');
      }
    },
  });
}
</script>

<template>
  <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
    <NH2 style="margin: 0">Users</NH2>
    <NButton type="primary" @click="router.push({ name: 'user-create' })">
      <template #icon><NIcon><AddOutline /></NIcon></template>
      Create User
    </NButton>
  </NSpace>
  <NDataTable
    :columns="columns"
    :data="userStore.users"
    :loading="userStore.loading"
    :bordered="true"
    size="small"
    :row-props="(row: User) => ({ style: 'cursor: pointer', onClick: () => router.push({ name: 'user-edit', params: { id: row.id } }) })"
  />
</template>
