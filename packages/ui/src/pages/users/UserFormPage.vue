<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NSelect, NSwitch, NButton, NSpace, NDivider, NH2, useMessage } from 'naive-ui';
import { useUserStore } from '@/stores/user.store';

const props = defineProps<{ id?: string }>();
const router = useRouter();
const userStore = useUserStore();
const message = useMessage();
const loading = ref(false);

const isEdit = computed(() => !!props.id);

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'operator' as string,
  isActive: true,
});

const newPassword = ref('');

const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Operator', value: 'operator' },
];

onMounted(async () => {
  if (props.id) {
    await userStore.fetchUser(props.id);
    if (userStore.currentUser) {
      form.value.name = userStore.currentUser.name;
      form.value.email = userStore.currentUser.email;
      form.value.role = userStore.currentUser.role;
      form.value.isActive = userStore.currentUser.isActive;
    }
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    if (isEdit.value && props.id) {
      await userStore.updateUser(props.id, {
        name: form.value.name,
        role: form.value.role,
        isActive: form.value.isActive,
      });
      if (newPassword.value) {
        await userStore.changePassword(props.id, newPassword.value);
      }
      message.success('User updated');
    } else {
      await userStore.createUser({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role: form.value.role,
      });
      message.success('User created');
    }
    router.push({ name: 'user-list' });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Operation failed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NH2>{{ isEdit ? 'Edit User' : 'Create User' }}</NH2>
  <NCard>
    <NForm @submit.prevent="handleSubmit">
      <NFormItem label="Name" required>
        <NInput v-model:value="form.name" placeholder="John Doe" />
      </NFormItem>
      <NFormItem label="Email" :required="!isEdit">
        <NInput v-model:value="form.email" :disabled="isEdit" placeholder="user@example.com" />
      </NFormItem>
      <NFormItem v-if="!isEdit" label="Password" required>
        <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="Minimum 8 characters" />
      </NFormItem>
      <NFormItem label="Role">
        <NSelect v-model:value="form.role" :options="roleOptions" />
      </NFormItem>
      <NFormItem v-if="isEdit" label="Active">
        <NSwitch v-model:value="form.isActive" />
      </NFormItem>

      <template v-if="isEdit">
        <NDivider>Change Password</NDivider>
        <NFormItem label="New Password">
          <NInput v-model:value="newPassword" type="password" show-password-on="click" placeholder="Leave blank to keep current" />
        </NFormItem>
      </template>

      <NSpace justify="end">
        <NButton @click="router.back()">Cancel</NButton>
        <NButton type="primary" attr-type="submit" :loading="loading">
          {{ isEdit ? 'Save Changes' : 'Create User' }}
        </NButton>
      </NSpace>
    </NForm>
  </NCard>
</template>
