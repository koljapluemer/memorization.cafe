<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        Stored passages
      </h2>
      <span class="badge badge-neutral">{{ items.length }}</span>
    </div>
    <div
      v-if="state === 'loading'"
      class="flex justify-center py-10"
    >
      <span
        class="loading loading-spinner loading-lg"
        aria-label="Loading passages"
      />
    </div>
    <div
      v-else-if="items.length === 0"
      class="card bg-base-100 shadow"
    >
      <div class="card-body text-sm text-base-content/70">
        <slot name="empty">
          <p>
            Nothing stored yet. Create your first passage to begin practising.
          </p>
        </slot>
      </div>
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <article
        v-for="item in items"
        :key="item.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-base font-semibold">
              {{ item.toMemorize.slice(0, 80) || 'Untitled' }}
            </h3>
            <div class="flex items-center gap-2 text-xs text-base-content/60">
              <span>Reps: {{ item.fsrsCard.reps }}</span>
              <span v-if="item.nextReview">Next: {{ formatRelative(item.nextReview) }}</span>
            </div>
          </div>
          <div class="space-y-4">
            <div v-if="item.preExercise">
              <p class="text-sm font-medium text-base-content/70">
                Pre exercise
              </p>
              <MarkdownPreview :source="item.preExercise" />
            </div>
            <div>
              <p class="text-sm font-medium text-base-content/70">
                To memorise
              </p>
              <MarkdownPreview :source="item.toMemorize" />
            </div>
            <div v-if="item.postExercise">
              <p class="text-sm font-medium text-base-content/70">
                Post exercise
              </p>
              <MarkdownPreview :source="item.postExercise" />
            </div>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <slot
              name="actions"
              :item="item"
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
import type { VerbatimItemRecord } from '../../../entities/verbatim-item';

type LoadState = 'idle' | 'loading';

interface Props {
  items: VerbatimItemRecord[];
  loading?: boolean;
}

const props = defineProps<Props>();

const state = computed<LoadState>(() => (props.loading ? 'loading' : 'idle'));
const items = computed(() => props.items);

function formatRelative(iso: string) {
  return new Date(iso).toLocaleString();
}
</script>
