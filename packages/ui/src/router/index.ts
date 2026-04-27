import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
        },
        {
          path: 'cas',
          name: 'ca-list',
          component: () => import('@/pages/ca/CaListPage.vue'),
        },
        {
          path: 'cas/create',
          name: 'ca-create',
          component: () => import('@/pages/ca/CaCreatePage.vue'),
        },
        {
          path: 'cas/upload',
          name: 'ca-upload',
          component: () => import('@/pages/ca/CaUploadPage.vue'),
        },
        {
          path: 'cas/:id',
          name: 'ca-detail',
          component: () => import('@/pages/ca/CaDetailPage.vue'),
          props: true,
        },
        {
          path: 'certificates',
          name: 'cert-list',
          component: () => import('@/pages/certificates/CertListPage.vue'),
        },
        {
          path: 'certificates/create',
          name: 'cert-create',
          component: () => import('@/pages/certificates/CertCreatePage.vue'),
        },
        {
          path: 'certificates/:id',
          name: 'cert-detail',
          component: () => import('@/pages/certificates/CertDetailPage.vue'),
          props: true,
        },
        {
          path: 'users',
          name: 'user-list',
          component: () => import('@/pages/users/UserListPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: 'users/create',
          name: 'user-create',
          component: () => import('@/pages/users/UserFormPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: 'users/:id/edit',
          name: 'user-edit',
          component: () => import('@/pages/users/UserFormPage.vue'),
          meta: { requiresAdmin: true },
          props: true,
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      return { name: 'login' };
    }
  }

  if (to.name === 'login' && auth.user) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'dashboard' };
  }
});

export { router };
