<template>
  <section class="card bg-base-100 shadow">
    <div class="card-body space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <slot name="summary" />
        <button
          type="button"
          class="btn"
          :disabled="isProcessing"
          @click="emit('refresh-requested')"
        >
          Refresh queue
        </button>
      </div>

      <div
        v-if="state === 'loading'"
        class="flex justify-center py-12"
      >
        <span
          class="loading loading-spinner loading-lg"
          aria-label="Loading study queue"
        />
      </div>

      <div
        v-else-if="!currentCardId"
        class="rounded-box border border-dashed border-base-300 p-10 text-center text-sm text-base-content/60"
      >
        <slot name="empty">
          All clear for now.
        </slot>
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <div class="badge badge-outline">
          <slot name="label" />
        </div>
        <div class="rounded-box border border-base-300 bg-base-200/50 p-6">
          <slot name="front" />
        </div>
        <transition name="fade">
          <div
            v-if="stage === 'back'"
            class="rounded-box border border-base-300 bg-base-200/50 p-6"
          >
            <slot name="back" />
          </div>
        </transition>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="stage === 'front'"
            type="button"
            class="btn btn-primary"
            @click="emit('reveal-requested')"
          >
            Reveal
          </button>
          <template v-else>
            <slot name="actions" />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  loading?: boolean;
  currentCardId?: string | null;
  stage: 'front' | 'back' | 'idle';
  isProcessing: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'refresh-requested': [];
  'reveal-requested': [];
}>();

const state = computed(() => (props.loading ? 'loading' : 'ready'));
const stage = computed(() => props.stage);
const isProcessing = computed(() => props.isProcessing);
const currentCardId = computed(() => props.currentCardId ?? null);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
