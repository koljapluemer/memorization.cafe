<template>
  <section class="card bg-base-100 shadow">
    <div class="card-body space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="card-title text-lg font-semibold">
            Verbatim Queue
          </h2>
          <p class="text-sm text-base-content/60">
            Due: {{ dueCount }} · New: {{ newCount }}
          </p>
        </div>
        <button
          type="button"
          class="btn"
          :disabled="isProcessing"
          @click="loadNext"
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
        v-else-if="!currentExercise"
        class="rounded-box border border-dashed border-base-300 p-10 text-center text-sm text-base-content/60"
      >
        All clear for now. Add more passages or revisit later.
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <div class="badge badge-outline">
          {{ currentExerciseLabel }}
        </div>
        <div
          v-if="currentExercise.item.preExercise"
          class="rounded-box border border-base-300 bg-base-200/50 p-6"
        >
          <MarkdownPreview :source="currentExercise.item.preExercise" />
        </div>
        <div class="rounded-box border border-base-300 bg-base-200/50 p-6">
          <MarkdownPreview :source="displayedExercise" />
        </div>
        <div
          v-if="stage === 'back' && currentExercise.item.postExercise"
          class="rounded-box border border-base-300 bg-base-200/50 p-6"
        >
          <MarkdownPreview :source="currentExercise.item.postExercise" />
        </div>
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
  type VerbatimItemRecord,
  type VerbatimRepository,
} from '../../entities/verbatim-item';

interface Props {
  repository: VerbatimRepository;
}

const props = defineProps<Props>();

interface PreparedExercise {
  item: VerbatimItemRecord;
  clozeText: string;
  revealText: string;
}

const allItems = ref<VerbatimItemRecord[]>([]);
const currentExercise = ref<PreparedExercise | null>(null);
const currentExerciseLabel = ref('');
const stage = ref<'front' | 'back'>('front');
const isLoading = ref(true);
const isProcessing = ref(false);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = props.repository.watchAll().subscribe({
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
  const dueItem = await props.repository.getNextDue(now);
  const fallback = dueItem ?? (await props.repository.getNextNew());
  currentExercise.value = fallback ? prepareExercise(fallback) : null;
  currentExerciseLabel.value = dueItem ? 'Due Item' : fallback ? 'New Item' : '';
  stage.value = 'front';
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
  await props.repository.review(currentExercise.value.item.id, rating, new Date());
  currentExercise.value = null;
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
