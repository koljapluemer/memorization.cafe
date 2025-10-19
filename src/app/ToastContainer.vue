<template>
  <div class="toast toast-end">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="alert"
      :class="{
        'alert-info': toast.type === 'info',
        'alert-success': toast.type === 'success',
        'alert-warning': toast.type === 'warning',
        'alert-error': toast.type === 'error',
      }"
    >
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from './toast';

const { toasts } = useToast();
</script>
