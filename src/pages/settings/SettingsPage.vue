<template>
  <div class="space-y-8">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h1 class="card-title text-lg font-semibold">
          Cloud Sync
        </h1>
        <p class="text-sm text-base-content/70">
          Log in to sync your flashcards and verbatim items across devices.
        </p>

        <div
          v-if="isLoggedIn"
          class="alert alert-success"
        >
          <span class="font-medium">Logged in as:</span>
          <span>{{ userName }}</span>
        </div>

        <div
          v-else
          class="alert alert-info"
        >
          <span>Not logged in. Your data is stored locally only.</span>
        </div>

        <div class="flex gap-2">
          <button
            v-if="!isLoggedIn"
            class="btn btn-primary"
            :disabled="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? 'Loading...' : 'Log in' }}
          </button>
          <button
            v-else
            class="btn btn-ghost"
            :disabled="isLoading"
            @click="handleLogout"
          >
            {{ isLoading ? 'Loading...' : 'Log out' }}
          </button>
        </div>

        <div
          v-if="error"
          class="alert alert-error"
        >
          <span>{{ error }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

import { useDatabase } from '../../app/providers';

const db = useDatabase();
const isLoggedIn = ref(false);
const userName = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

let userSubscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  // Subscribe to currentUser observable
  userSubscription = db.cloud.currentUser.subscribe({
    next: (user) => {
      isLoggedIn.value = user?.isLoggedIn ?? false;
      userName.value = user?.name ?? '';
    },
    error: (err) => {
      if (typeof globalThis !== 'undefined' && globalThis.console) {
        globalThis.console.error('User subscription error:', err);
      }
    },
  });
});

onUnmounted(() => {
  userSubscription?.unsubscribe();
});

async function handleLogin() {
  isLoading.value = true;
  error.value = null;

  try {
    await db.cloud.login();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to log in';
  } finally {
    isLoading.value = false;
  }
}

async function handleLogout() {
  isLoading.value = true;
  error.value = null;

  try {
    await db.cloud.logout();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to log out';
  } finally {
    isLoading.value = false;
  }
}
</script>
