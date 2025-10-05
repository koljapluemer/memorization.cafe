<template>
  <section class="card bg-base-100 shadow">
    <div class="card-body space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="card-title text-lg font-semibold">
            Study Queue
          </h2>
          <p class="text-sm text-base-content/60">
            Due: {{ dueCount }} · New: {{ newCount }}
          </p>
        </div>
        <button
          type="button"
          class="btn"
          :disabled="isProcessing"
          @click="loadNextCard"
        >
          Refresh Queue
        </button>
      </div>

      <div
        v-if="isLoading"
        class="flex justify-center py-12"
      >
        <span
          class="loading loading-spinner loading-lg"
          aria-label="Loading study queue"
        />
      </div>

      <div
        v-else-if="!currentCard"
        class="rounded-box border border-dashed border-base-300 p-10 text-center text-sm text-base-content/60"
      >
        Nothing to review. Add more cards or come back later.
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <div class="badge badge-outline">
          {{ currentCardLabel }}
        </div>
        <div class="rounded-box border border-base-300 bg-base-200/50 p-6">
          <MarkdownPreview :source="currentCard.front" />
        </div>
        <transition name="fade">
          <div
            v-if="stage === 'back'"
            class="rounded-box border border-base-300 bg-base-200/50 p-6"
          >
            <MarkdownPreview :source="currentCard.back" />
          </div>
        </transition>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="stage === 'front'"
            type="button"
            class="btn btn-primary"
            @click="reveal"
          >
            Reveal
          </button>
          <template v-else>
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
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import MarkdownPreview from '../../dumb/MarkdownPreview.vue';
import {
  Rating,
  type Grade,
  type FlashcardRecord,
  type FlashcardRepository,
} from '../../entities/flashcard';

interface Props {
  repository: FlashcardRepository;
}

const props = defineProps<Props>();

const allCards = ref<FlashcardRecord[]>([]);
const currentCard = ref<FlashcardRecord | null>(null);
const currentCardLabel = ref('');
const stage = ref<'idle' | 'front' | 'back'>('idle');
const isLoading = ref(true);
const isProcessing = ref(false);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = props.repository.watchAll().subscribe({
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
  const dueCard = await props.repository.getNextDue(now);
  const fallbackCard = dueCard ?? (await props.repository.getNextNew());
  currentCard.value = fallbackCard ?? null;
  currentCardLabel.value = dueCard ? 'Due Card' : fallbackCard ? 'New Card' : '';
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
  await props.repository.review(currentCard.value.id, rating, new Date());
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
