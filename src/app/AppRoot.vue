<template>
  <div class="flex min-h-full flex-col">
    <header class="border-b bg-base-100">
      <div class="navbar mx-auto w-full max-w-6xl px-4">
        <div class="navbar-start">
          <RouterLink
            to="/dashboard"
            class="text-xl font-semibold"
          >
            Memorization Café
          </RouterLink>
        </div>
        <nav class="navbar-center">
          <ul class="menu menu-horizontal gap-2 rounded-box bg-base-200 px-2 py-1">
            <li
              v-for="item in navItems"
              :key="item.to"
              :class="{ active: item.active }"
            >
              <RouterLink
                :to="item.to"
                class="flex items-center gap-2"
              >
                <component
                  :is="item.icon"
                  class="h-4 w-4"
                />
                <span class="text-sm font-medium">
                  {{ item.label }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </nav>
        <div class="navbar-end" />
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { FileText, Layers, LayoutDashboard, Settings } from 'lucide-vue-next';

const route = useRoute();

const navItems = computed(() => [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    active: route.path.startsWith('/dashboard'),
  },
  {
    label: 'Flashcards',
    to: '/flashcards/list',
    icon: Layers,
    active: route.path.startsWith('/flashcards'),
  },
  {
    label: 'Verbatim',
    to: '/verbatim/list',
    icon: FileText,
    active: route.path.startsWith('/verbatim'),
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    active: route.path.startsWith('/settings'),
  },
]);
</script>
