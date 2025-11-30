<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold">
      Stats
    </h1>

    <div
      v-if="isLoading"
      class="flex items-center gap-2"
    >
      <span class="loading loading-spinner loading-sm" />
      <span>Loading stats...</span>
    </div>

    <template v-else>
      <div
        v-if="!hasItems"
        class="text-light"
      >
        No learning items yet. Add some to see your progress.
      </div>

      <template v-else>
        <section class="space-y-3">
          <h2 class="text-xl font-semibold">
            Overall
          </h2>
          <div class="stats shadow">
            <div class="stat">
              <div class="stat-title">
                Due
              </div>
              <div class="stat-value text-primary">
                {{ stats.overall.due }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">
                Not due
              </div>
              <div class="stat-value text-secondary">
                {{ stats.overall.notDue }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">
                Unseen
              </div>
              <div class="stat-value">
                {{ stats.overall.unseen }}
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">
            By item type
          </h2>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Due</th>
                  <th>Not due</th>
                  <th>Unseen</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="type in itemTypes"
                  :key="type"
                >
                  <td class="font-medium">
                    {{ typeLabels[type] }}
                  </td>
                  <td>{{ stats.byType[type].due }}</td>
                  <td>{{ stats.byType[type].notDue }}</td>
                  <td>{{ stats.byType[type].unseen }}</td>
                  <td>{{ getTotal(stats.byType[type]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-semibold">
            By collection
          </h2>
          <div class="space-y-4">
            <div
              v-for="collectionStat in stats.byCollection"
              :key="collectionStat.collection.id"
              class="card shadow"
            >
              <div class="card-body space-y-3">
                <div class="flex items-center justify-between">
                  <div class="card-title">
                    {{ collectionStat.collection.name }}
                  </div>
                  <div class="text-light">
                    {{ getTotal(collectionStat.overall) }} items
                  </div>
                </div>

                <div class="stats shadow">
                  <div class="stat">
                    <div class="stat-title">
                      Due
                    </div>
                    <div class="stat-value text-primary">
                      {{ collectionStat.overall.due }}
                    </div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">
                      Not due
                    </div>
                    <div class="stat-value text-secondary">
                      {{ collectionStat.overall.notDue }}
                    </div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">
                      Unseen
                    </div>
                    <div class="stat-value">
                      {{ collectionStat.overall.unseen }}
                    </div>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Due</th>
                        <th>Not due</th>
                        <th>Unseen</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="type in itemTypes"
                        :key="`${collectionStat.collection.id}-${type}`"
                      >
                        <td class="font-medium">
                          {{ typeLabels[type] }}
                        </td>
                        <td>{{ collectionStat.byType[type].due }}</td>
                        <td>{{ collectionStat.byType[type].notDue }}</td>
                        <td>{{ collectionStat.byType[type].unseen }}</td>
                        <td>{{ getTotal(collectionStat.byType[type]) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import * as ebisu from 'ebisu-js';
import { State } from 'ts-fsrs';

import { collectionRepo } from '@/entities/collection/repo';
import type { Collection } from '@/entities/collection/Collection';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard/repo';
import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import { conceptRepo } from '@/entities/concept/repo';
import type { Concept } from '@/entities/concept/Concept';
import { listRepo } from '@/entities/list/repo';
import type { List } from '@/entities/list/List';
import { clozeRepo } from '@/entities/cloze/repo';
import type { Cloze } from '@/entities/cloze/Cloze';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import type { LearningProgress } from '@/entities/learning-progress/LearningProgress';

type ItemType = 'flashcard' | 'concept' | 'list' | 'cloze';
type Status = 'due' | 'notDue' | 'unseen';

interface StatusCounts {
  due: number;
  notDue: number;
  unseen: number;
}

interface CollectionStats {
  collection: Collection;
  overall: StatusCounts;
  byType: Record<ItemType, StatusCounts>;
}

interface StatsState {
  overall: StatusCounts;
  byType: Record<ItemType, StatusCounts>;
  byCollection: CollectionStats[];
}

const itemTypes: ItemType[] = ['flashcard', 'concept', 'list', 'cloze'];
const typeLabels: Record<ItemType, string> = {
  flashcard: 'Flashcards',
  concept: 'Concepts',
  list: 'Lists',
  cloze: 'Clozes',
};

const RECALL_THRESHOLD = 0.9;
const MINIMUM_HOURS_BETWEEN_PRACTICE = 1;

const isLoading = ref(true);
const stats = ref<StatsState>({
  overall: createEmptyCounts(),
  byType: createEmptyTypeCounts(),
  byCollection: [],
});

const hasItems = computed(() => {
  const total = getTotal(stats.value.overall);
  return total > 0;
});

onMounted(async () => {
  await loadStats();
});

function createEmptyCounts(): StatusCounts {
  return {
    due: 0,
    notDue: 0,
    unseen: 0,
  };
}

function createEmptyTypeCounts(): Record<ItemType, StatusCounts> {
  return {
    flashcard: createEmptyCounts(),
    concept: createEmptyCounts(),
    list: createEmptyCounts(),
    cloze: createEmptyCounts(),
  };
}

function addCount(target: StatusCounts, status: Status): void {
  target[status] += 1;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function getFlashcardStatus(progress: LearningProgress | undefined, now: Date): Status {
  if (!progress?.cardData) return 'unseen';

  const dueDate = toDate(progress.cardData.due);
  return dueDate <= now ? 'due' : 'notDue';
}

function getClozeStatus(progress: LearningProgress | undefined, now: Date): Status {
  if (!progress?.cardData) return 'unseen';

  const card = progress.cardData;
  const dueDate = toDate(card.due);

  if (card.state !== State.New && dueDate <= now) {
    return 'due';
  }

  return 'notDue';
}

function getListStatus(progress: LearningProgress | undefined, now: Date): Status {
  if (!progress?.listData) return 'unseen';

  const lastReview = toDate(progress.listData.lastReviewTimestamp);
  const elapsedHours = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60);

  if (elapsedHours < MINIMUM_HOURS_BETWEEN_PRACTICE) {
    return 'notDue';
  }

  const recallProbability = ebisu.predictRecall(progress.listData.model, elapsedHours, true);
  return recallProbability < RECALL_THRESHOLD ? 'due' : 'notDue';
}

function getConceptStatus(progress: LearningProgress | undefined, now: Date): Status {
  if (!progress?.answers || progress.answers.length === 0) {
    return 'unseen';
  }

  const lastAnswer = progress.answers[progress.answers.length - 1];
  const lastAnswerDate = toDate(lastAnswer.timestamp);

  if (isSameCalendarDay(lastAnswerDate, now)) {
    return 'notDue';
  }

  return 'due';
}

function getTotal(counts: StatusCounts): number {
  return counts.due + counts.notDue + counts.unseen;
}

async function loadStats() {
  isLoading.value = true;
  const now = new Date();

  const [
    collections,
    flashcards,
    concepts,
    lists,
    clozes,
  ] = await Promise.all([
    collectionRepo.getAll(),
    simpleFlashcardRepo.getAll(),
    conceptRepo.getAll(),
    listRepo.getAll(),
    clozeRepo.getAll(),
  ]);

  const allItemIds = [
    ...flashcards.map(item => item.id).filter((id): id is string => Boolean(id)),
    ...concepts.map(item => item.id).filter((id): id is string => Boolean(id)),
    ...lists.map(item => item.id).filter((id): id is string => Boolean(id)),
    ...clozes.map(item => item.id).filter((id): id is string => Boolean(id)),
  ];

  const progressRecords = allItemIds.length > 0
    ? await learningProgressRepo.getAllProgressForItems(allItemIds)
    : [];

  const progressMap = new Map<string, LearningProgress>();
  progressRecords.forEach((progress) => {
    if (progress.learningItemId) {
      progressMap.set(progress.learningItemId, progress);
    }
  });

  const overallCounts = createEmptyCounts();
  const typeCounts = createEmptyTypeCounts();
  const collectionStatsMap = new Map<string, CollectionStats>();
  const collectionLookup = new Map(collections.map((collection) => [collection.id!, collection]));

  const ensureCollectionEntry = (collectionId: string): CollectionStats => {
    let entry = collectionStatsMap.get(collectionId);
    if (!entry) {
      const collection = collectionLookup.get(collectionId) || { id: collectionId, name: 'Unknown collection' };
      entry = {
        collection,
        overall: createEmptyCounts(),
        byType: createEmptyTypeCounts(),
      };
      collectionStatsMap.set(collectionId, entry);
    }
    return entry;
  };

  flashcards.forEach((flashcard: SimpleFlashcard) => {
    if (!flashcard.id || flashcard.isDisabled) return;

    const progress = progressMap.get(flashcard.id);
    const status = getFlashcardStatus(progress, now);

    addCount(overallCounts, status);
    addCount(typeCounts.flashcard, status);

    const collectionEntry = ensureCollectionEntry(flashcard.collectionId);
    addCount(collectionEntry.overall, status);
    addCount(collectionEntry.byType.flashcard, status);
  });

  concepts.forEach((concept: Concept) => {
    if (!concept.id) return;

    const progress = progressMap.get(concept.id);
    const status = getConceptStatus(progress, now);

    addCount(overallCounts, status);
    addCount(typeCounts.concept, status);

    const collectionEntry = ensureCollectionEntry(concept.collectionId);
    addCount(collectionEntry.overall, status);
    addCount(collectionEntry.byType.concept, status);
  });

  lists.forEach((list: List) => {
    if (!list.id) return;

    const progress = progressMap.get(list.id);
    const status = getListStatus(progress, now);

    addCount(overallCounts, status);
    addCount(typeCounts.list, status);

    const collectionEntry = ensureCollectionEntry(list.collectionId);
    addCount(collectionEntry.overall, status);
    addCount(collectionEntry.byType.list, status);
  });

  clozes.forEach((cloze: Cloze) => {
    if (!cloze.id) return;

    const progress = progressMap.get(cloze.id);
    const status = getClozeStatus(progress, now);

    addCount(overallCounts, status);
    addCount(typeCounts.cloze, status);

    const collectionEntry = ensureCollectionEntry(cloze.collectionId);
    addCount(collectionEntry.overall, status);
    addCount(collectionEntry.byType.cloze, status);
  });

  stats.value = {
    overall: overallCounts,
    byType: typeCounts,
    byCollection: Array.from(collectionStatsMap.values()).sort((a, b) =>
      a.collection.name.localeCompare(b.collection.name)
    ),
  };

  isLoading.value = false;
}
</script>
