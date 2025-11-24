import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/practice',
    },
    {
      path: '/practice',
      name: 'Practice',
      component: () => import('@/pages/practice/PracticePage.vue'),
    },
    {
      path: '/manage',
      name: 'Manage',
      component: () => import('@/pages/manage/ManagePage.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
    },
    {
      path: '/public/:shareId',
      name: 'PublicCollection',
      component: () => import('@/pages/public/PublicCollectionPage.vue'),
    },
  ],
});

export { router };
