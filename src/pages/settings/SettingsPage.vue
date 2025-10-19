<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">
      Settings
    </h1>

    <!-- Question Lists Section -->
    <div class="mb-8">
      <QuestionListManager />
    </div>

    <div class="divider" />

    <!-- Sync Status Display -->
    <div class="mb-6">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">Sync Status:</span>
        <span
          class="text-sm"
          :class="syncStatusClass"
        >
          {{ cloudSync.syncStatus.value }}
        </span>
      </div>
    </div>

    <!-- Not Logged In State -->
    <div
      v-if="!cloudSync.isLoggedIn.value && !cloudSync.userInteraction.value"
      class="space-y-4"
    >
      <div class="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="stroke-current shrink-0 w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm">Sign in to sync your collections across devices</span>
      </div>
      <button
        class="btn btn-primary w-full"
        @click="handleLogin"
      >
        Sign In to Sync
      </button>
    </div>

    <!-- User Interaction Handler (Email/OTP Input) -->
    <div
      v-else-if="cloudSync.userInteraction.value"
      class="space-y-4"
    >
      <!-- Title -->
      <div
        v-if="cloudSync.userInteraction.value.title"
        class="text-sm font-semibold"
      >
        {{ cloudSync.userInteraction.value.title }}
      </div>

      <!-- Alerts -->
      <div
        v-if="cloudSync.userInteraction.value.alerts && cloudSync.userInteraction.value.alerts.length > 0"
      >
        <div
          v-for="(alert, index) in cloudSync.userInteraction.value.alerts"
          :key="index"
          class="alert mb-2"
          :class="{
            'alert-info': alert.type === 'info',
            'alert-warning': alert.type === 'warning',
            'alert-error': alert.type === 'error',
          }"
        >
          <svg
            v-if="alert.type === 'info'"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span class="text-sm">{{ formatAlertMessage(alert) }}</span>
        </div>
      </div>

      <!-- Input Fields -->
      <div
        v-if="cloudSync.userInteraction.value.fields"
        class="space-y-3"
      >
        <div
          v-for="(field, key) in cloudSync.userInteraction.value.fields"
          :key="key"
          class="form-control w-full"
        >
          <label
            :for="key"
            class="label"
          >
            <span class="label-text">{{ field.label }}</span>
          </label>
          <input
            :id="key"
            v-model="interactionInputs[key]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder || ''"
            class="input input-bordered w-full"
            @keyup.enter="handleSubmitInteraction"
          >
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 mt-4">
        <button
          v-if="cloudSync.userInteraction.value.cancelLabel"
          class="btn btn-ghost"
          @click="handleCancelInteraction"
        >
          {{ cloudSync.userInteraction.value.cancelLabel }}
        </button>
        <button
          v-if="cloudSync.userInteraction.value.submitLabel"
          class="btn btn-primary"
          @click="handleSubmitInteraction"
        >
          {{ cloudSync.userInteraction.value.submitLabel }}
        </button>
      </div>
    </div>

    <!-- Logged In State -->
    <div
      v-else-if="cloudSync.isLoggedIn.value"
      class="space-y-4"
    >
      <div class="alert alert-success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="flex flex-col">
          <span class="font-semibold">Synced</span>
          <span class="text-sm opacity-80">{{ cloudSync.currentUser.value?.email }}</span>
        </div>
      </div>

      <button
        class="btn btn-error btn-outline w-full"
        @click="handleLogout"
      >
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

import { useCloudSync } from '@/app/useCloudSync';
import { useToast } from '@/app/toast';
import { QuestionListManager } from '@/features/question-list-manager';

const cloudSync = useCloudSync();
const toast = useToast();
const interactionInputs = ref<Record<string, string>>({});

// Reset inputs when interaction changes
watch(
  () => cloudSync.userInteraction.value,
  (interaction) => {
    if (interaction?.fields) {
      interactionInputs.value = {};
    }
  }
);

const syncStatusClass = computed(() => {
  const status = cloudSync.syncStatus.value;
  if (status.includes('Syncing') || status.includes('Connecting')) {
    return 'text-info';
  }
  if (status.includes('Connected')) {
    return 'text-success';
  }
  if (status.includes('Error')) {
    return 'text-error';
  }
  return 'text-base-content';
});

const handleLogin = async () => {
  try {
    await cloudSync.login();
  } catch (error) {
    toast.show(`Login failed: ${error}`, 'error');
  }
};

const handleLogout = async () => {
  try {
    await cloudSync.logout();
  } catch (error) {
    toast.show(`Logout failed: ${error}`, 'error');
  }
};

const handleSubmitInteraction = () => {
  cloudSync.submitInteraction(interactionInputs.value);
  interactionInputs.value = {};
};

const handleCancelInteraction = () => {
  cloudSync.cancelInteraction();
  interactionInputs.value = {};
};

const formatAlertMessage = (alert: { message: string; messageParams?: Record<string, string> }) => {
  let message = alert.message || '';
  if (alert.messageParams) {
    Object.keys(alert.messageParams).forEach((key) => {
      const value = alert.messageParams?.[key];
      if (value !== undefined) {
        message = message.replace(`{${key}}`, value);
      }
    });
  }
  return message;
};
</script>
