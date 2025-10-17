<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="currentItem && currentItemType">
      <SimpleFlashcardPractice
        v-if="currentItemType === 'flashcard'"
        :flashcard="currentItem as SimpleFlashcard"
        @complete="loadNextItem"
      />
      <ElaborativeInterrogationPractice
        v-else-if="currentItemType === 'concept'"
        :concept="currentItem as ElaborativeInterrogationConcept"
        @complete="loadNextItem"
      />
    </div>

    <div
      v-else
      class="text-center py-12"
    >
      <p class="text-lg">
        No items to practice right now.
      </p>
      <p class="text-sm text-gray-500 mt-2">
        Add some learning items or adjust your filters.
      </p>
    </div>

    <!-- Filter FAB -->
    <button
      class="btn btn-circle btn-primary fixed bottom-4 right-4"
      aria-label="Filter"
      @click="openFilterModal"
    >
      <Filter :size="20" />
    </button>

    <FilterModal
      ref="filterModalRef"
      :collections="collections"
      :current-filters="filters"
      @apply="handleFilterApply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Filter } from 'lucide-vue-next';

import FilterModal from './FilterModal.vue';
import { loadFilters, saveFilters, type PracticeFilters } from './filter-storage';

import type { SimpleFlashcard } from '@/app/database';
import type { ElaborativeInterrogationConcept } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo, ElaborativeInterrogationPractice } from '@/entities/elaborative-interrogation';
import { learningProgressRepo } from '@/entities/learning-progress';
import { simpleFlashcardRepo, SimpleFlashcardPractice } from '@/entities/simple-flashcard';


const collections = ref<Collection[]>([]);
const filters = ref<PracticeFilters>(loadFilters());
const filterModalRef = ref<InstanceType<typeof FilterModal> | null>(null);

const currentItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | null>(null);
const currentItemType = ref<'flashcard' | 'concept' | null>(null);

onMounted(async () => {
  collections.value = await collectionRepo.getAll();

  // Initialize filters if empty
  if (filters.value.selectedCollectionIds.length === 0) {
    filters.value.selectedCollectionIds = collections.value.map(c => c.id!);
    saveFilters(filters.value);
  }

  await loadNextItem();
});

async function loadNextItem() {
  currentItem.value = null;
  currentItemType.value = null;

  const activeCollectionIds = filters.value.selectedCollectionIds.length > 0
    ? filters.value.selectedCollectionIds
    : collections.value.map(c => c.id!);

  if (activeCollectionIds.length === 0) return;

  const activeTypes = filters.value.selectedItemTypes;
  const shuffledTypes = [...activeTypes].sort(() => Math.random() - 0.5);

  for (const itemType of shuffledTypes) {
    const now = new Date();

    if (itemType === 'flashcard') {
      // Try to get a due flashcard
      const dueFlashcard = await simpleFlashcardRepo.getRandomDue(activeCollectionIds, now);
      if (dueFlashcard) {
        currentItem.value = dueFlashcard;
        currentItemType.value = 'flashcard';
        return;
      }

      // Try to get a new flashcard
      const allProgress = await learningProgressRepo.getAllProgressForItems(
        (await simpleFlashcardRepo.getAll()).map(f => f.id!)
      );
      const existingIds = allProgress.map(p => p.learningItemId);
      const newFlashcard = await simpleFlashcardRepo.getRandomNew(activeCollectionIds, existingIds);
      if (newFlashcard) {
        currentItem.value = newFlashcard;
        currentItemType.value = 'flashcard';
        return;
      }
    } else if (itemType === 'concept') {
      // Try to get a due concept
      const dueConcept = await elaborativeInterrogationRepo.getRandomDue(activeCollectionIds, now);
      if (dueConcept) {
        currentItem.value = dueConcept;
        currentItemType.value = 'concept';
        return;
      }

      // Try to get a new concept
      const allProgress = await learningProgressRepo.getAllProgressForItems(
        (await elaborativeInterrogationRepo.getAll()).map(c => c.id!)
      );
      const existingIds = allProgress.map(p => p.learningItemId);
      const newConcept = await elaborativeInterrogationRepo.getRandomNew(activeCollectionIds, existingIds);
      if (newConcept) {
        currentItem.value = newConcept;
        currentItemType.value = 'concept';
        return;
      }
    }
  }
}

function openFilterModal() {
  filterModalRef.value?.open();
}

function handleFilterApply(newFilters: PracticeFilters) {
  filters.value = newFilters;
  saveFilters(newFilters);
  loadNextItem();
}
</script>

