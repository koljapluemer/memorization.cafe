import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/dashboard/DashboardPage.vue'),
  },
  {
    path: '/flashcards',
    name: 'flashcards',
    component: () => import('../pages/flashcards/FlashcardsPage.vue'),
  },
  {
    path: '/verbatim',
    name: 'verbatim',
    component: () => import('../pages/verbatim/VerbatimPage.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/settings/SettingsPage.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
