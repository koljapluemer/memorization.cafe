<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Flashcards
          </h1>
          <p class="text-sm text-base-content/70">
            Browse your cards, jump into the queue, or edit individual entries.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            class="btn"
            to="/flashcards/queue"
          >
            Open queue
          </RouterLink>
          <RouterLink
            class="btn btn-primary"
            to="/flashcards/edit"
          >
            Add flashcard
          </RouterLink>
        </div>
      </div>
    </section>

    <FlashcardList
      :items="flashcards"
      :loading="isLoading"
    >
      <template #empty>
        <p>
          No cards yet. Create your first flashcard to get started.
        </p>
      </template>
      <template #actions="{ card }">
        <RouterLink
          :to="`/flashcards/edit/${card.id}`"
          class="btn btn-sm"
        >
          Edit
        </RouterLink>
        <button
          type="button"
          class="btn btn-sm btn-error"
          @click="confirmDelete(card)"
        >
          Delete
        </button>
      </template>
    </FlashcardList>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useFlashcardRepository } from '../../app/providers';
import FlashcardList from './components/FlashcardList.vue';
import type { FlashcardRecord } from '../../entities/flashcard';

const repository = useFlashcardRepository();

const flashcards = ref<FlashcardRecord[]>([]);
const isLoading = ref(true);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(value) {
      flashcards.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load flashcards', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

async function confirmDelete(record: FlashcardRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this flashcard?') : true;
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
