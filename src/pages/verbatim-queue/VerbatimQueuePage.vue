<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Verbatim queue
          </h1>
          <p class="text-sm text-base-content/70">
            Practise cloze recalls first on due passages, then on fresh ones.
          </p>
        </div>
        <RouterLink
          class="btn"
          to="/verbatim/list"
        >
          Manage passages
        </RouterLink>
      </div>
    </section>

    <FlashcardStudyPanel
      :loading="isLoading"
      :current-card-id="currentExercise?.item.id ?? null"
      :stage="stage"
      :is-processing="isProcessing"
      @refresh-requested="loadNext"
      @reveal-requested="reveal"
    >
      <template #summary>
        <p class="text-sm text-base-content/60">
          Due: {{ dueCount }} · New: {{ newCount }}
        </p>
      </template>
      <template #empty>
        Queue is empty. Add more passages or come back later.
      </template>
      <template #label>
        {{ currentExerciseLabel }}
      </template>
      <template #front>
        <div class="space-y-4">
          <div v-if="currentExercise?.item.preExercise">
            <MarkdownPreview :source="currentExercise?.item.preExercise ?? ''" />
          </div>
          <MarkdownPreview :source="displayedExercise" />
        </div>
      </template>
      <template #back>
        <div class="space-y-4">
          <div v-if="currentExercise?.item.preExercise">
            <MarkdownPreview :source="currentExercise?.item.preExercise ?? ''" />
          </div>
          <MarkdownPreview :source="currentExercise?.item.toMemorize ?? ''" />
          <div v-if="currentExercise?.item.postExercise">
            <MarkdownPreview :source="currentExercise?.item.postExercise ?? ''" />
          </div>
        </div>
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
import { useVerbatimRepository } from '../../app/providers';
import type { Grade, VerbatimItemRecord } from '../../entities/verbatim-item';
import { Rating } from '../../entities/verbatim-item';

interface PreparedExercise {
  item: VerbatimItemRecord;
  clozeText: string;
  revealText: string;
}

const repository = useVerbatimRepository();

const allItems = ref<VerbatimItemRecord[]>([]);
const currentExercise = ref<PreparedExercise | null>(null);
const currentExerciseLabel = ref('');
const stage = ref<'front' | 'back' | 'idle'>('front');
const isLoading = ref(true);
const isProcessing = ref(false);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(items) {
      allItems.value = items;
      isLoading.value = false;
      if (!currentExercise.value) {
        void loadNext();
      }
    },
    error(error) {
      reportError('Failed to observe verbatim items', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

const dueCount = computed(() => {
  const nowIso = new Date().toISOString();
  return allItems.value.filter((item) => item.nextReview && item.nextReview <= nowIso).length;
});

const newCount = computed(() => allItems.value.filter((item) => item.fsrsCard.reps === 0).length);

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

const displayedExercise = computed(() => {
  if (!currentExercise.value) {
    return '';
  }
  return stage.value === 'front'
    ? currentExercise.value.clozeText
    : currentExercise.value.revealText;
});

async function loadNext() {
  isProcessing.value = true;
  const now = new Date();
  const dueItem = await repository.getNextDue(now);
  const fallback = dueItem ?? (await repository.getNextNew());
  currentExercise.value = fallback ? prepareExercise(fallback) : null;
  currentExerciseLabel.value = dueItem ? 'Due item' : fallback ? 'New item' : '';
  stage.value = currentExercise.value ? 'front' : 'idle';
  isProcessing.value = false;
}

function reveal() {
  stage.value = 'back';
}

async function grade(rating: Grade) {
  if (!currentExercise.value) {
    return;
  }
  isProcessing.value = true;
  await repository.review(currentExercise.value.item.id, rating, new Date());
  currentExercise.value = null;
  stage.value = 'idle';
  await loadNext();
  isProcessing.value = false;
}

function prepareExercise(item: VerbatimItemRecord): PreparedExercise {
  const tokens = item.toMemorize.split(/(\s+)/);
  const wordIndices = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => /[\p{L}\p{N}]{3,}/u.test(token));

  if (wordIndices.length === 0) {
    return {
      item,
      clozeText: item.toMemorize,
      revealText: item.toMemorize,
    };
  }

  const selectionIndex = Math.floor(Math.random() * wordIndices.length);
  const selection = wordIndices[selectionIndex];
  if (!selection) {
    return {
      item,
      clozeText: item.toMemorize,
      revealText: item.toMemorize,
    };
  }

  const clozeTokens = [...tokens];
  clozeTokens[selection.index] = '＿＿';
  const revealTokens = [...tokens];
  revealTokens[selection.index] = `**${selection.token}**`;

  return {
    item,
    clozeText: clozeTokens.join(''),
    revealText: revealTokens.join(''),
  };
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
