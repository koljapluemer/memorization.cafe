<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Flashcard queue
          </h1>
          <p class="text-sm text-base-content/70">
            Work through due cards first. If none are due, a new card appears.
          </p>
        </div>
        <RouterLink
          class="btn"
          to="/flashcards/list"
        >
          Manage cards
        </RouterLink>
      </div>
    </section>

    <FlashcardStudyPanel
      :loading="isLoading"
      :current-card-id="currentCard?.id ?? null"
      :stage="stage"
      :is-processing="isProcessing"
      @refresh-requested="loadNextCard"
      @reveal-requested="reveal"
    >
      <template #summary>
        <p class="text-sm text-base-content/60">
          Due: {{ dueCount }} · New: {{ newCount }}
        </p>
      </template>
      <template #empty>
        All clear for now. Come back later or add new cards.
      </template>
      <template #label>
        {{ currentCardLabel }}
      </template>
      <template #front>
        <MarkdownPreview :source="currentCard?.front ?? ''" />
      </template>
      <template #back>
        <MarkdownPreview :source="currentCard?.back ?? ''" />
      </template>
      <template #actions>
        <button
          v-for="action in ratingActions"
          :key="action.rating"
          type="button"
          class="btn flex-1 min-w-[120px]"
          :class="action.className"
          :disabled="isProcessing"
          @click="grade(action.rating)"
        >
          {{ action.label }}
        </button>
      </template>
    </FlashcardStudyPanel>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import FlashcardStudyPanel from '../../features/flashcard-study/FlashcardStudyPanel.vue';
import MarkdownPreview from '../../dumb/MarkdownPreview.vue';
import { useFlashcardRepository } from '../../app/providers';
import type { FlashcardRecord, Grade } from '../../entities/flashcard';
import { Rating } from '../../entities/flashcard';

const repository = useFlashcardRepository();

const allCards = ref<FlashcardRecord[]>([]);
const currentCard = ref<FlashcardRecord | null>(null);
const currentCardLabel = ref('');
const stage = ref<'idle' | 'front' | 'back'>('idle');
const isLoading = ref(true);
const isProcessing = ref(false);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(cards) {
      allCards.value = cards;
      isLoading.value = false;
      if (!currentCard.value) {
        void loadNextCard();
      }
    },
    error(error) {
      reportError('Failed to observe flashcards', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

const dueCount = computed(() => {
  const nowIso = new Date().toISOString();
  return allCards.value.filter((card) => card.nextReview && card.nextReview <= nowIso).length;
});

const newCount = computed(() => allCards.value.filter((card) => card.fsrsCard.reps === 0).length);

const ratingActions: ReadonlyArray<{
  rating: Grade;
  label: string;
  className: string;
}> = [
  { rating: Rating.Again as Grade, label: 'Again', className: 'btn-error' },
  { rating: Rating.Hard as Grade, label: 'Hard', className: 'btn-warning' },
  { rating: Rating.Good as Grade, label: 'Good', className: 'btn-success' },
  { rating: Rating.Easy as Grade, label: 'Easy', className: 'btn-accent' },
];

async function loadNextCard() {
  isProcessing.value = true;
  const now = new Date();
  const dueCard = await repository.getNextDue(now);
  const fallbackCard = dueCard ?? (await repository.getNextNew());
  currentCard.value = fallbackCard ?? null;
  currentCardLabel.value = dueCard ? 'Due card' : fallbackCard ? 'New card' : '';
  stage.value = currentCard.value ? 'front' : 'idle';
  isProcessing.value = false;
}

function reveal() {
  stage.value = 'back';
}

async function grade(rating: Grade) {
  if (!currentCard.value) {
    return;
  }
  isProcessing.value = true;
  await repository.review(currentCard.value.id, rating, new Date());
  stage.value = 'idle';
  currentCard.value = null;
  await loadNextCard();
  isProcessing.value = false;
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
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
