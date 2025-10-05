<template>
  <div class="space-y-8">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h1 class="card-title text-lg font-semibold">
          Dexie Cloud Sync
        </h1>
        <p class="text-sm text-base-content/70">
          Provide your Dexie Cloud details to sync flashcards and verbatim items across devices.
        </p>
        <div
          class="alert"
          :class="statusClass"
        >
          <span class="font-medium">
            Status:
          </span>
          <span>
            {{ statusText }}
          </span>
        </div>
        <form
          class="space-y-4"
          @submit.prevent="onSubmit"
        >
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Database URL
            </span>
            <input
              v-model="form.databaseUrl"
              type="url"
              class="input input-bordered"
              placeholder="https://your-db.dexie.cloud"
              required
            >
          </label>
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Access Token (optional)
            </span>
            <input
              v-model="form.accessToken"
              type="text"
              class="input input-bordered"
              placeholder="Paste a token if your project requires it"
            >
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="form.requireAuth"
              type="checkbox"
              class="toggle"
            >
            <span class="label-text">
              Require authentication
            </span>
          </label>
          <div class="flex flex-wrap justify-between gap-2">
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="!form.databaseUrl"
            >
              Save settings
            </button>
            <button
              class="btn btn-ghost"
              type="button"
              :disabled="!cloudContext.settings.value"
              @click="disableSync"
            >
              Disable sync
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import { useCloudSettings } from '../../app/providers';

interface CloudSyncFormState {
  databaseUrl: string;
  requireAuth: boolean;
  accessToken: string;
}

const cloudContext = useCloudSettings();

const form = reactive<CloudSyncFormState>({
  databaseUrl: '',
  requireAuth: false,
  accessToken: '',
});

watch(
  () => cloudContext.settings.value,
  (value) => {
    if (value) {
      form.databaseUrl = value.databaseUrl;
      form.requireAuth = value.requireAuth;
      form.accessToken = value.accessToken ?? '';
    } else {
      form.databaseUrl = '';
      form.requireAuth = false;
      form.accessToken = '';
    }
  },
  { immediate: true },
);

const statusText = computed(() => (cloudContext.settings.value ? 'Enabled' : 'Disabled'));
const statusClass = computed(() => (cloudContext.settings.value ? 'alert-success' : 'alert-info'));

function onSubmit() {
  if (!form.databaseUrl) {
    return;
  }
  cloudContext.update({
    databaseUrl: form.databaseUrl.trim(),
    requireAuth: form.requireAuth,
    accessToken: form.accessToken.trim() || undefined,
  });
}

function disableSync() {
  cloudContext.update(null);
}
</script>
