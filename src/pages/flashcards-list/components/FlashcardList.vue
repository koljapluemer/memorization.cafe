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
      class="overflow-x-auto"
    >
      <table class="table">
        <thead>
          <tr>
            <th>
              <label>
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="selectedIds.size === items.length && items.length > 0"
                  @change="toggleSelectAll"
                >
              </label>
            </th>
            <th>Front</th>
            <th>Back</th>
            <th>Reps</th>
            <th>Next Review</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cardItem in items"
            :key="cardItem.id"
          >
            <th>
              <label>
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="selectedIds.has(cardItem.id)"
                  @change="toggleSelect(cardItem.id)"
                >
              </label>
            </th>
            <td>
              <div class="max-w-xs">
                <MarkdownPreview :source="truncate(cardItem.front, 100)" />
              </div>
            </td>
            <td>
              <div class="max-w-xs">
                <MarkdownPreview :source="truncate(cardItem.back, 100)" />
              </div>
            </td>
            <td>{{ cardItem.fsrsCard.reps }}</td>
            <td>
              <span
                v-if="cardItem.nextReview"
                class="text-xs"
              >
                {{ formatRelative(cardItem.nextReview) }}
              </span>
              <span
                v-else
                class="text-xs text-base-content/50"
              >
                -
              </span>
            </td>
            <td>
              <div class="flex gap-2">
                <slot
                  name="actions"
                  :card="cardItem"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
  selectedIds: Set<string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggleSelect: [id: string];
  toggleSelectAll: [];
}>();

const state = computed<LoadState>(() => (props.loading ? 'loading' : 'idle'));
const items = computed(() => props.items);

function formatRelative(iso: string) {
  return new Date(iso).toLocaleString();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function toggleSelect(id: string) {
  emit('toggleSelect', id);
}

function toggleSelectAll() {
  emit('toggleSelectAll');
}
</script>
