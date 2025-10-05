<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        Stored flashcards
      </h2>
      <span class="badge badge-neutral">{{ items.length }}</span>
    </div>
    <div
      v-if="state === 'loading'"
      class="flex justify-center py-10"
    >
      <span
        class="loading loading-spinner loading-lg"
        aria-label="Loading flashcards"
      />
    </div>
    <div
      v-else-if="items.length === 0"
      class="card bg-base-100 shadow"
    >
      <div class="card-body text-sm text-base-content/70">
        <slot name="empty">
          <p>
            No cards yet. Create your first flashcard to get started.
          </p>
        </slot>
      </div>
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="cardItem in items"
        :key="cardItem.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-base font-semibold">
              {{ cardItem.front.slice(0, 80) || 'Untitled' }}
            </h3>
            <div class="flex items-center gap-2 text-xs text-base-content/60">
              <span>Reps: {{ cardItem.fsrsCard.reps }}</span>
              <span v-if="cardItem.nextReview">Next: {{ formatRelative(cardItem.nextReview) }}</span>
            </div>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-base-content/70">
                Front
              </p>
              <MarkdownPreview :source="cardItem.front" />
            </div>
            <div>
              <p class="text-sm font-medium text-base-content/70">
                Back
              </p>
              <MarkdownPreview :source="cardItem.back" />
            </div>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <slot
              name="actions"
              :card="cardItem"
            />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import MarkdownPreview from '../../../dumb/MarkdownPreview.vue';
import type { FlashcardRecord } from '../../../entities/flashcard';

type LoadState = 'idle' | 'loading';

interface Props {
  items: FlashcardRecord[];
  loading?: boolean;
}

const props = defineProps<Props>();

const state = computed<LoadState>(() => (props.loading ? 'loading' : 'idle'));
const items = computed(() => props.items);

function formatRelative(iso: string) {
  return new Date(iso).toLocaleString();
}
</script>
