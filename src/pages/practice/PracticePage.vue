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
      <ListPractice
        v-else-if="currentItemType === 'list'"
        :list="currentItem as List"
        @complete="loadNextItem"
      />
      <ClozePractice
        v-else-if="currentItemType === 'cloze'"
        :cloze="currentItem as Cloze"
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

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo, ElaborativeInterrogationPractice } from '@/entities/elaborative-interrogation';
import { learningProgressRepo } from '@/entities/learning-progress';
import { simpleFlashcardRepo, SimpleFlashcardPractice } from '@/entities/simple-flashcard';
import { listRepo, ListPractice } from '@/entities/list';
import { clozeRepo, ClozePractice } from '@/entities/cloze';


const collections = ref<Collection[]>([]);
const filters = ref<PracticeFilters>(loadFilters());
const filterModalRef = ref<InstanceType<typeof FilterModal> | null>(null);

const currentItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);
const currentItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze' | null>(null);

onMounted(async () => {
  collections.value = await collectionRepo.getAll();
  await loadNextItem();
});

async function loadNextItem() {
  currentItem.value = null;
  currentItemType.value = null;

  // Calculate active collections (all collections minus excluded ones)
  const allCollectionIds = collections.value.map(c => c.id!);
  const activeCollectionIds = allCollectionIds.filter(
    id => !filters.value.excludedCollectionIds.includes(id)
  );

  if (activeCollectionIds.length === 0) return;

  // Calculate active types (all types minus excluded ones)
  const allTypes: ('flashcard' | 'concept' | 'list' | 'cloze')[] = ['flashcard', 'concept', 'list', 'cloze'];
  const activeTypes = allTypes.filter(
    type => !filters.value.excludedItemTypes.includes(type)
  );

  if (activeTypes.length === 0) return;

  // 15% chance to prioritize new items over due items
  const prioritizeNew = Math.random() < 0.15;

  const shuffledTypes = [...activeTypes].sort(() => Math.random() - 0.5);

  for (const itemType of shuffledTypes) {
    const now = new Date();

    if (itemType === 'flashcard') {
      if (prioritizeNew) {
        // Try to get a new flashcard first
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

        // Fallback to due flashcard
        const dueFlashcard = await simpleFlashcardRepo.getRandomDue(activeCollectionIds, now);
        if (dueFlashcard) {
          currentItem.value = dueFlashcard;
          currentItemType.value = 'flashcard';
          return;
        }
      } else {
        // Try to get a due flashcard first
        const dueFlashcard = await simpleFlashcardRepo.getRandomDue(activeCollectionIds, now);
        if (dueFlashcard) {
          currentItem.value = dueFlashcard;
          currentItemType.value = 'flashcard';
          return;
        }

        // Fallback to new flashcard
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
      }
    } else if (itemType === 'concept') {
      if (prioritizeNew) {
        // Try to get a new concept first
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

        // Fallback to due concept
        const dueConcept = await elaborativeInterrogationRepo.getRandomDue(activeCollectionIds, now);
        if (dueConcept) {
          currentItem.value = dueConcept;
          currentItemType.value = 'concept';
          return;
        }
      } else {
        // Try to get a due concept first
        const dueConcept = await elaborativeInterrogationRepo.getRandomDue(activeCollectionIds, now);
        if (dueConcept) {
          currentItem.value = dueConcept;
          currentItemType.value = 'concept';
          return;
        }

        // Fallback to new concept
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
    } else if (itemType === 'list') {
      if (prioritizeNew) {
        // Try to get a new list first
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          (await listRepo.getAll()).map(l => l.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newList = await listRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newList) {
          currentItem.value = newList;
          currentItemType.value = 'list';
          return;
        }

        // Fallback to due list
        const dueList = await listRepo.getRandomDue(activeCollectionIds, now);
        if (dueList) {
          currentItem.value = dueList;
          currentItemType.value = 'list';
          return;
        }
      } else {
        // Try to get a due list first
        const dueList = await listRepo.getRandomDue(activeCollectionIds, now);
        if (dueList) {
          currentItem.value = dueList;
          currentItemType.value = 'list';
          return;
        }

        // Fallback to new list
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          (await listRepo.getAll()).map(l => l.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newList = await listRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newList) {
          currentItem.value = newList;
          currentItemType.value = 'list';
          return;
        }
      }
    } else if (itemType === 'cloze') {
      if (prioritizeNew) {
        // Try to get a new cloze first
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          (await clozeRepo.getAll()).map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newCloze = await clozeRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newCloze) {
          currentItem.value = newCloze;
          currentItemType.value = 'cloze';
          return;
        }

        // Fallback to due cloze
        const dueCloze = await clozeRepo.getRandomDue(activeCollectionIds, now);
        if (dueCloze) {
          currentItem.value = dueCloze;
          currentItemType.value = 'cloze';
          return;
        }
      } else {
        // Try to get a due cloze first
        const dueCloze = await clozeRepo.getRandomDue(activeCollectionIds, now);
        if (dueCloze) {
          currentItem.value = dueCloze;
          currentItemType.value = 'cloze';
          return;
        }

        // Fallback to new cloze
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          (await clozeRepo.getAll()).map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newCloze = await clozeRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newCloze) {
          currentItem.value = newCloze;
          currentItemType.value = 'cloze';
          return;
        }
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

