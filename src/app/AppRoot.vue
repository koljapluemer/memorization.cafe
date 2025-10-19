<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 container mx-auto p-4">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';

import ToastContainer from './ToastContainer.vue';

import AppHeader from '@/dumb/AppHeader.vue';
</script>
