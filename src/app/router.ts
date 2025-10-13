import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/collections/list',
  },
  {
    path: '/study',
    name: 'study',
    component: () => import('../pages/study/StudyPage.vue'),
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
    path: '/settings',
    name: 'settings',
    component: () => import('../pages/settings/SettingsPage.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
