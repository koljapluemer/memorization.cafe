<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Verbatim passages
          </h1>
          <p class="text-sm text-base-content/70">
            Keep your passages organised, review them, or edit the text directly.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            class="btn"
            to="/verbatim/queue"
          >
            Open queue
          </RouterLink>
          <RouterLink
            class="btn btn-primary"
            to="/verbatim/edit"
          >
            Add passage
          </RouterLink>
        </div>
      </div>
    </section>

    <VerbatimList
      :items="items"
      :loading="isLoading"
    >
      <template #empty>
        <p>
          Nothing stored yet. Create your first passage to begin practising.
        </p>
      </template>
      <template #actions="{ item }">
        <RouterLink
          :to="`/verbatim/edit/${item.id}`"
          class="btn btn-sm"
        >
          Edit
        </RouterLink>
        <button
          type="button"
          class="btn btn-sm btn-error"
          @click="confirmDelete(item)"
        >
          Delete
        </button>
      </template>
    </VerbatimList>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useVerbatimRepository } from '../../app/providers';
import type { VerbatimItemRecord } from '../../entities/verbatim-item';
import VerbatimList from './components/VerbatimList.vue';

const repository = useVerbatimRepository();

const items = ref<VerbatimItemRecord[]>([]);
const isLoading = ref(true);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(value) {
      items.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load passages', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

async function confirmDelete(record: VerbatimItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this passage?') : true;
  if (!shouldDelete) {
    return;
  }
  await repository.remove(record.id);
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
