<script setup lang="ts">
import { h, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NSpace, NText, NIcon } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import {
  HomeOutline,
  ShieldCheckmarkOutline,
  DocumentLockOutline,
  PeopleOutline,
  LogOutOutline,
} from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = computed<MenuOption[]>(() => {
  const items: MenuOption[] = [
    { label: 'Dashboard', key: 'dashboard', icon: renderIcon(HomeOutline) },
    { label: 'Certificate Authorities', key: 'ca-list', icon: renderIcon(ShieldCheckmarkOutline) },
    { label: 'Certificates', key: 'cert-list', icon: renderIcon(DocumentLockOutline) },
  ];
  if (auth.isAdmin) {
    items.push({ label: 'Users', key: 'user-list', icon: renderIcon(PeopleOutline) });
  }
  return items;
});

const activeKey = computed(() => {
  const name = route.name as string;
  if (name?.startsWith('ca-')) return 'ca-list';
  if (name?.startsWith('cert-')) return 'cert-list';
  if (name?.startsWith('user-')) return 'user-list';
  return name || 'dashboard';
});

function handleMenuUpdate(key: string) {
  router.push({ name: key });
}

async function handleLogout() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider
      bordered
      :width="240"
      :collapsed-width="64"
      collapse-mode="width"
      show-trigger
      content-style="padding: 8px 0;"
    >
      <div style="padding: 16px 24px; font-size: 18px; font-weight: 700">
        Web CA
      </div>
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered style="height: 56px; display: flex; align-items: center; justify-content: flex-end; padding: 0 24px;">
        <NSpace align="center">
          <NText>{{ auth.user?.name }}</NText>
          <NButton quaternary circle @click="handleLogout">
            <template #icon>
              <NIcon><LogOutOutline /></NIcon>
            </template>
          </NButton>
        </NSpace>
      </NLayoutHeader>
      <NLayoutContent content-style="padding: 24px;" :native-scrollbar="false">
        <router-view />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
