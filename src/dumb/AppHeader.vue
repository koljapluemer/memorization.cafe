<template>
  <header class="navbar bg-base-200">
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <img
          src="/android-chrome-192x192.png"
          alt="MC Logo"
          class="w-8 h-8"
        >
        <h1 class="text-xl font-bold hidden md:block">
          Memorization Cafe
        </h1>
      </div>
    </div>
    <div class="flex-none">
      <nav class="flex gap-2">
        <router-link
          to="/practice"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/practice') }"
        >
          <Brain :size="20" />
          <span class="hidden sm:inline">Practice</span>
        </router-link>

        <router-link
          to="/manage"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/manage') }"
        >
          <FolderOpen :size="20" />
          <span class="hidden sm:inline">Manage</span>
        </router-link>

        <router-link
          to="/settings"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/settings') }"
        >
          <Settings :size="20" />
          <span class="hidden sm:inline">Settings</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { Brain, FolderOpen, Settings } from 'lucide-vue-next';

const route = useRoute();

function isActive(path: string): boolean {
  return route.path.startsWith(path);
}
</script>
