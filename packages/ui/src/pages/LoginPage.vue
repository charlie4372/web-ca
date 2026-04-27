<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage, useThemeVars } from 'naive-ui';
import { useAuthStore } from '@/stores/auth.store';

const themeVars = useThemeVars();
const bgStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: themeVars.value.bodyColor,
}));

const router = useRouter();
const auth = useAuthStore();
const message = useMessage();

const form = ref({ email: '', password: '' });
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await auth.login(form.value.email, form.value.password);
    router.push({ name: 'dashboard' });
  } catch (err: any) {
    message.error(err?.data?.error?.message || 'Login failed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div :style="bgStyle">
    <NCard title="Web CA" style="width: 400px">
      <template #header-extra>
        Sign in
      </template>
      <NForm @submit.prevent="handleLogin">
        <NFormItem label="Email">
          <NInput v-model:value="form.email" type="text" placeholder="Username" />
        </NFormItem>
        <NFormItem label="Password">
          <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="Password" @keyup.enter="handleLogin" />
        </NFormItem>
        <NSpace justify="end">
          <NButton type="primary" :loading="loading" @click="handleLogin">
            Sign In
          </NButton>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>
