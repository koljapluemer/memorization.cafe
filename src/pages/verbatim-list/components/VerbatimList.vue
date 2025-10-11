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
            <th>Pre Exercise</th>
            <th>To Memorize</th>
            <th>Post Exercise</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <th>
              <label>
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="selectedIds.has(item.id)"
                  @change="toggleSelect(item.id)"
                >
              </label>
            </th>
            <td>
              <div class="max-w-xs">
                <MarkdownPreview
                  v-if="item.preExercise"
                  :source="truncate(item.preExercise, 80)"
                />
                <span
                  v-else
                  class="text-xs text-base-content/50"
                >
                  -
                </span>
              </div>
            </td>
            <td>
              <div class="max-w-md">
                <MarkdownPreview :source="truncate(item.toMemorize, 120)" />
              </div>
            </td>
            <td>
              <div class="max-w-xs">
                <MarkdownPreview
                  v-if="item.postExercise"
                  :source="truncate(item.postExercise, 80)"
                />
                <span
                  v-else
                  class="text-xs text-base-content/50"
                >
                  -
                </span>
              </div>
            </td>
            <td>
              <div class="flex gap-2">
                <slot
                  name="actions"
                  :item="item"
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
import type { VerbatimItemRecord } from '../../../entities/verbatim-item';

type LoadState = 'idle' | 'loading';

interface Props {
  items: VerbatimItemRecord[];
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
