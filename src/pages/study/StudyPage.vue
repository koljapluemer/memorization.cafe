<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Study
          </h1>
          <p class="text-sm text-base-content/70">
            Combined study queue for all learning materials
          </p>
        </div>
        <button
          type="button"
          class="btn"
          @click="showFilterModal = true"
        >
          Filters
        </button>
      </div>
    </section>

    <FlashcardStudyPanel
      :loading="isLoading"
      :current-card-id="currentItem?.id ?? null"
      :stage="stage"
      :is-processing="isProcessing"
      @refresh-requested="loadNextItem"
      @reveal-requested="reveal"
    >
      <template #summary>
        <p class="text-sm text-base-content/60">
          Due: {{ dueCount }} · New: {{ newCount }}
          <span
            v-if="activeFilters.length > 0"
            class="ml-2 text-primary"
          >
            (Filtered: {{ activeFilters.join(', ') }})
          </span>
        </p>
      </template>
      <template #empty>
        All clear for now. Come back later or adjust filters.
      </template>
      <template #label>
        {{ currentItemLabel }}
      </template>
      <template #front>
        <div
          v-if="currentItem?.type === 'flashcard'"
          class="space-y-4"
        >
          <MarkdownPreview :source="(currentItem.data as FlashcardRecord).front ?? ''" />
        </div>
        <div
          v-else-if="currentItem?.type === 'verbatim'"
          class="space-y-4"
        >
          <div v-if="currentExercise?.item.preExercise">
            <MarkdownPreview :source="currentExercise.item.preExercise" />
          </div>
          <MarkdownPreview :source="displayedExercise" />
        </div>
      </template>
      <template #back>
        <div
          v-if="currentItem?.type === 'flashcard'"
          class="space-y-4"
        >
          <MarkdownPreview :source="(currentItem.data as FlashcardRecord).back ?? ''" />
        </div>
        <div
          v-else-if="currentItem?.type === 'verbatim'"
          class="space-y-4"
        >
          <div v-if="currentExercise?.item.postExercise">
            <MarkdownPreview :source="currentExercise.item.postExercise" />
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

    <!-- Filter Modal -->
    <div
      class="modal"
      :class="{ 'modal-open': showFilterModal }"
    >
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          Filter Study Queue
        </h3>

        <div class="space-y-4">
          <!-- Modality Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Modality</span>
            </label>
            <select
              v-model="filterModality"
              class="select select-bordered w-full"
            >
              <option value="all">
                All
              </option>
              <option value="flashcards">
                Flashcards only
              </option>
              <option value="verbatim">
                Verbatim only
              </option>
            </select>
          </div>

          <!-- Collection Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Collection</span>
            </label>
            <select
              v-model="filterCollectionId"
              class="select select-bordered w-full"
            >
              <option value="">
                All collections
              </option>
              <option
                v-for="collection in collections"
                :key="collection.id"
                :value="collection.id"
              >
                {{ collection.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn"
            @click="closeFilterModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="applyFilters"
          >
            Apply
          </button>
        </div>
      </div>
      <div
        class="modal-backdrop"
        @click="closeFilterModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import FlashcardStudyPanel from '../../features/flashcard-study/FlashcardStudyPanel.vue';
import MarkdownPreview from '../../dumb/MarkdownPreview.vue';
import { useFlashcardRepository, useVerbatimRepository, useCollectionRepository, useLearningItemRepository } from '../../app/providers';
import type { FlashcardRecord, Grade as FlashcardGrade } from '../../entities/flashcard';
import { Rating as FlashcardRating } from '../../entities/flashcard';
import type { VerbatimItemRecord, Grade as VerbatimGrade } from '../../entities/verbatim-item';
import type { CollectionRecord } from '../../entities/collection';
import type { LearningItemRecord } from '../../entities/learning-item';

type Grade = FlashcardGrade | VerbatimGrade;

interface UnifiedItem {
  id: string;
  type: 'flashcard' | 'verbatim';
  data: FlashcardRecord | VerbatimItemRecord;
  nextReview: string | null;
  reps: number;
  learningItemId: string;
}

interface PreparedExercise {
  item: VerbatimItemRecord;
  clozeText: string;
  revealText: string;
}

const route = useRoute();
const router = useRouter();

const flashcardRepository = useFlashcardRepository();
const verbatimRepository = useVerbatimRepository();
const collectionRepository = useCollectionRepository();
const learningItemRepository = useLearningItemRepository();

const allFlashcards = ref<FlashcardRecord[]>([]);
const allVerbatimItems = ref<VerbatimItemRecord[]>([]);
const allLearningItems = ref<LearningItemRecord[]>([]);
const collections = ref<CollectionRecord[]>([]);

const currentItem = ref<UnifiedItem | null>(null);
const currentItemLabel = ref('');
const currentExercise = ref<PreparedExercise | null>(null);
const stage = ref<'idle' | 'front' | 'back'>('idle');
const isLoading = ref(true);
const isProcessing = ref(false);

const showFilterModal = ref(false);
const filterModality = ref<'all' | 'flashcards' | 'verbatim'>('all');
const filterCollectionId = ref<string>('');

let flashcardSubscription: { unsubscribe: () => void } | null = null;
let verbatimSubscription: { unsubscribe: () => void } | null = null;
let learningItemSubscription: { unsubscribe: () => void } | null = null;
let collectionSubscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  // Read filters from URL on mount
  const modalityParam = route.query.modality as string | undefined;
  if (modalityParam === 'flashcards' || modalityParam === 'verbatim') {
    filterModality.value = modalityParam;
  } else {
    filterModality.value = 'all';
  }

  const collectionParam = route.query.collection as string | undefined;
  if (collectionParam) {
    filterCollectionId.value = collectionParam;
  }

  // Subscribe to all data sources
  flashcardSubscription = flashcardRepository.watchAll().subscribe({
    next(cards) {
      allFlashcards.value = cards;
      checkLoadingComplete();
    },
    error(error) {
      reportError('Failed to observe flashcards', error);
      checkLoadingComplete();
    },
  });

  verbatimSubscription = verbatimRepository.watchAll().subscribe({
    next(items) {
      allVerbatimItems.value = items;
      checkLoadingComplete();
    },
    error(error) {
      reportError('Failed to observe verbatim items', error);
      checkLoadingComplete();
    },
  });

  learningItemSubscription = learningItemRepository.watchAll().subscribe({
    next(items) {
      allLearningItems.value = items;
      checkLoadingComplete();
    },
    error(error) {
      reportError('Failed to observe learning items', error);
      checkLoadingComplete();
    },
  });

  collectionSubscription = collectionRepository.watchAll().subscribe({
    next(cols) {
      collections.value = cols;
    },
    error(error) {
      reportError('Failed to observe collections', error);
    },
  });
});

onBeforeUnmount(() => {
  flashcardSubscription?.unsubscribe();
  verbatimSubscription?.unsubscribe();
  learningItemSubscription?.unsubscribe();
  collectionSubscription?.unsubscribe();
});

let initialLoadCompleted = false;

function checkLoadingComplete() {
  if (!initialLoadCompleted && allFlashcards.value.length >= 0 && allVerbatimItems.value.length >= 0) {
    initialLoadCompleted = true;
    isLoading.value = false;
    if (!currentItem.value) {
      void loadNextItem();
    }
  }
}

// Watch for URL query changes
watch(() => route.query, () => {
  const modalityParam = route.query.modality as string | undefined;
  if (modalityParam === 'flashcards' || modalityParam === 'verbatim') {
    filterModality.value = modalityParam;
  } else {
    filterModality.value = 'all';
  }

  const collectionParam = route.query.collection as string | undefined;
  filterCollectionId.value = collectionParam ?? '';

  // Reload the queue when filters change
  void loadNextItem();
});

const unifiedQueue = computed(() => {
  const items: UnifiedItem[] = [];

  // Apply modality filter
  if (filterModality.value === 'all' || filterModality.value === 'flashcards') {
    for (const card of allFlashcards.value) {
      items.push({
        id: card.id,
        type: 'flashcard',
        data: card,
        nextReview: card.nextReview,
        reps: card.fsrsCard.reps,
        learningItemId: card.learningItemId,
      });
    }
  }

  if (filterModality.value === 'all' || filterModality.value === 'verbatim') {
    for (const item of allVerbatimItems.value) {
      items.push({
        id: item.id,
        type: 'verbatim',
        data: item,
        nextReview: item.nextReview,
        reps: item.fsrsCard.reps,
        learningItemId: item.learningItemId,
      });
    }
  }

  // Apply collection filter if specified
  if (filterCollectionId.value) {
    const learningItemsInCollection = new Set(
      allLearningItems.value
        .filter(li => li.collectionId === filterCollectionId.value)
        .map(li => li.id)
    );

    return items.filter(item => learningItemsInCollection.has(item.learningItemId));
  }

  return items;
});

const dueItems = computed(() => {
  const nowIso = new Date().toISOString();
  return unifiedQueue.value.filter(item => item.nextReview && item.nextReview <= nowIso);
});

const newItems = computed(() => {
  return unifiedQueue.value.filter(item => item.reps === 0);
});

const dueCount = computed(() => dueItems.value.length);
const newCount = computed(() => newItems.value.length);

const activeFilters = computed(() => {
  const filters: string[] = [];
  if (filterModality.value !== 'all') {
    filters.push(filterModality.value);
  }
  if (filterCollectionId.value) {
    const collection = collections.value.find(c => c.id === filterCollectionId.value);
    if (collection) {
      filters.push(collection.title);
    }
  }
  return filters;
});

const ratingActions: ReadonlyArray<{
  rating: Grade;
  label: string;
  className: string;
}> = [
  { rating: FlashcardRating.Again as Grade, label: 'Again', className: 'btn-error' },
  { rating: FlashcardRating.Hard as Grade, label: 'Hard', className: 'btn-warning' },
  { rating: FlashcardRating.Good as Grade, label: 'Good', className: 'btn-success' },
  { rating: FlashcardRating.Easy as Grade, label: 'Easy', className: 'btn-accent' },
];

const displayedExercise = computed(() => {
  if (!currentExercise.value) {
    return '';
  }
  return stage.value === 'front'
    ? currentExercise.value.clozeText
    : currentExercise.value.revealText;
});

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

async function loadNextItem() {
  isProcessing.value = true;

  // Smart selection: prioritize due items, then new items
  let selectedItem: UnifiedItem | null = null;
  let label = '';

  const due = dueItems.value;
  const fresh = newItems.value;

  if (due.length > 0) {
    // Shuffle due items for variety
    const shuffledDue = shuffleArray(due);
    selectedItem = shuffledDue[0] ?? null;
    label = 'Due';
  } else if (fresh.length > 0) {
    // Shuffle new items for variety
    const shuffledNew = shuffleArray(fresh);
    selectedItem = shuffledNew[0] ?? null;
    label = 'New';
  }

  currentItem.value = selectedItem;
  currentItemLabel.value = selectedItem ? `${label} ${selectedItem.type}` : '';

  // Prepare exercise if verbatim
  if (selectedItem?.type === 'verbatim') {
    currentExercise.value = prepareExercise(selectedItem.data as VerbatimItemRecord);
  } else {
    currentExercise.value = null;
  }

  stage.value = currentItem.value ? 'front' : 'idle';
  isProcessing.value = false;
}

function reveal() {
  stage.value = 'back';
}

async function grade(rating: Grade) {
  if (!currentItem.value) {
    return;
  }

  isProcessing.value = true;

  if (currentItem.value.type === 'flashcard') {
    await flashcardRepository.review(currentItem.value.id, rating as FlashcardGrade, new Date());
  } else if (currentItem.value.type === 'verbatim') {
    await verbatimRepository.review(currentItem.value.id, rating as VerbatimGrade, new Date());
  }

  stage.value = 'idle';
  currentItem.value = null;
  currentExercise.value = null;
  await loadNextItem();
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

function closeFilterModal() {
  showFilterModal.value = false;
}

function applyFilters() {
  const query: Record<string, string> = {};

  if (filterModality.value !== 'all') {
    query.modality = filterModality.value;
  }

  if (filterCollectionId.value) {
    query.collection = filterCollectionId.value;
  }

  void router.push({
    path: '/study',
    query,
  });

  closeFilterModal();
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
