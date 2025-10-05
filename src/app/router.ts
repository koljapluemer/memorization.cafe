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
    redirect: '/flashcards/list',
  },
  {
    path: '/flashcards/list',
    name: 'flashcards-list',
    component: () => import('../pages/flashcards-list/FlashcardsListPage.vue'),
  },
  {
    path: '/flashcards/edit',
    name: 'flashcards-create',
    component: () => import('../pages/flashcards-edit/FlashcardsEditPage.vue'),
  },
  {
    path: '/flashcards/edit/:id',
    name: 'flashcards-edit',
    component: () => import('../pages/flashcards-edit/FlashcardsEditPage.vue'),
  },
  {
    path: '/flashcards/queue',
    name: 'flashcards-queue',
    component: () => import('../pages/flashcards-queue/FlashcardsQueuePage.vue'),
  },
  {
    path: '/verbatim',
    redirect: '/verbatim/list',
  },
  {
    path: '/verbatim/list',
    name: 'verbatim-list',
    component: () => import('../pages/verbatim-list/VerbatimListPage.vue'),
  },
  {
    path: '/verbatim/edit',
    name: 'verbatim-create',
    component: () => import('../pages/verbatim-edit/VerbatimEditPage.vue'),
  },
  {
    path: '/verbatim/edit/:id',
    name: 'verbatim-edit',
    component: () => import('../pages/verbatim-edit/VerbatimEditPage.vue'),
  },
  {
    path: '/verbatim/queue',
    name: 'verbatim-queue',
    component: () => import('../pages/verbatim-queue/VerbatimQueuePage.vue'),
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
