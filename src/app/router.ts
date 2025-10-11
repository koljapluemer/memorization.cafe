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
    path: '/collections',
    redirect: '/collections/list',
  },
  {
    path: '/collections/list',
    name: 'collections-list',
    component: () => import('../pages/collections-list/CollectionsListPage.vue'),
  },
  {
    path: '/collections/edit',
    name: 'collections-create',
    component: () => import('../pages/collections-edit/CollectionsEditPage.vue'),
  },
  {
    path: '/collections/edit/:id',
    name: 'collections-edit',
    component: () => import('../pages/collections-edit/CollectionsEditPage.vue'),
  },
  {
    path: '/collections/:id/items',
    name: 'collection-items',
    component: () => import('../pages/collection-items/CollectionItemsPage.vue'),
  },
  {
    path: '/learning-items',
    redirect: '/learning-items/list',
  },
  {
    path: '/learning-items/list',
    name: 'learning-items-list',
    component: () => import('../pages/learning-items-list/LearningItemsListPage.vue'),
  },
  {
    path: '/learning-items/edit',
    name: 'learning-items-create',
    component: () => import('../pages/learning-items-edit/LearningItemsEditPage.vue'),
  },
  {
    path: '/learning-items/edit/:id',
    name: 'learning-items-edit',
    component: () => import('../pages/learning-items-edit/LearningItemsEditPage.vue'),
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
