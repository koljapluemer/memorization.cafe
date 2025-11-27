<template>
  <div class="max-w-2xl mx-auto">
    <Transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="currentItem && currentItemType && !isLoading"
        :key="currentItem.id"
      >
        <SimpleFlashcardPractice
          v-if="currentItemType === 'flashcard'"
          :flashcard="currentItem as SimpleFlashcard"
          @complete="loadNextItem"
          @skip="loadNextItem"
          @edit="handleEdit"
          @delete="handleDelete"
          @disable="handleDisable"
          @filter="openFilterModal"
        />
        <ElaborativeInterrogationPractice
          v-else-if="currentItemType === 'concept'"
          :concept="currentItem as ElaborativeInterrogationConcept"
          @complete="loadNextItem"
          @skip="loadNextItem"
          @edit="handleEdit"
          @delete="handleDelete"
          @filter="openFilterModal"
        />
        <ListPractice
          v-else-if="currentItemType === 'list'"
          :list="currentItem as List"
          @complete="loadNextItem"
          @skip="loadNextItem"
          @edit="handleEdit"
          @delete="handleDelete"
          @filter="openFilterModal"
        />
        <ClozePractice
          v-else-if="currentItemType === 'cloze'"
          :cloze="currentItem as Cloze"
          @complete="loadNextItem"
          @skip="loadNextItem"
          @edit="handleEdit"
          @delete="handleDelete"
          @filter="openFilterModal"
        />
      </div>

      <div
        v-else-if="isLoading"
        key="loading"
        class="text-center py-12"
      >
        <Transition name="fade">
          <span
            v-if="showSpinner"
            class="loading loading-spinner loading-lg"
          />
        </Transition>
      </div>

      <div
        v-else
        key="empty"
        class="text-center py-12"
      >
        <p class="text-lg">
          No items to practice right now.
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Add some learning items or adjust your filters.
        </p>
      </div>
    </Transition>

    <FilterModal
      ref="filterModalRef"
      :collections="collections"
      :current-filters="filters"
      @apply="handleFilterApply"
    />

    <LearningItemEditModal
      v-if="currentItem && currentItemType"
      ref="editModalRef"
      :item-type="currentItemType"
      :item="currentItem"
      :is-new="false"
      @save="handleSaveEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import FilterModal from './FilterModal.vue';
import { loadFilters, saveFilters, type PracticeFilters } from './filter-storage';
import LearningItemEditModal from '@/pages/manage/LearningItemEditModal.vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo, ElaborativeInterrogationPractice } from '@/entities/elaborative-interrogation';
import { learningProgressRepo } from '@/entities/learning-progress';
import { simpleFlashcardRepo, SimpleFlashcardPractice } from '@/entities/simple-flashcard';
import { listRepo, ListPractice } from '@/entities/list';
import { clozeRepo, ClozePractice } from '@/entities/cloze';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';


const collections = ref<Collection[]>([]);
const filters = ref<PracticeFilters>(loadFilters());
const filterModalRef = ref<InstanceType<typeof FilterModal> | null>(null);
const editModalRef = ref<InstanceType<typeof LearningItemEditModal> | null>(null);

const flashcards = ref<SimpleFlashcard[]>([]);
const concepts = ref<ElaborativeInterrogationConcept[]>([]);
const lists = ref<List[]>([]);
const clozes = ref<Cloze[]>([]);

const currentItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);
const currentItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze' | null>(null);

const isLoading = ref(false);
const showSpinner = ref(false);
let spinnerTimeout: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  collections.value = await collectionRepo.getAll();
  flashcards.value = await simpleFlashcardRepo.getAll();
  concepts.value = await elaborativeInterrogationRepo.getAll();
  lists.value = await listRepo.getAll();
  clozes.value = await clozeRepo.getAll();
  await loadNextItem();
});

/**
 * Counts items of a specific type in a collection
 */
function countCollectionItems(collectionId: string, itemType: 'flashcard' | 'concept' | 'list' | 'cloze'): number {
  switch (itemType) {
    case 'flashcard':
      return flashcards.value.filter(f => f.collectionId === collectionId && !f.isDisabled).length;
    case 'concept':
      return concepts.value.filter(c => c.collectionId === collectionId).length;
    case 'list':
      return lists.value.filter(l => l.collectionId === collectionId).length;
    case 'cloze':
      return clozes.value.filter(c => c.collectionId === collectionId).length;
  }
}

/**
 * Selects a collection using weighted random selection (sqrt dampening)
 */
function selectWeightedCollection(
  activeCollectionIds: string[],
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze'
): string | null {
  const weightedCollections: WeightedItem<string>[] = activeCollectionIds.map(id => ({
    item: id,
    weight: Math.sqrt(countCollectionItems(id, itemType)),
  }));

  return weightedRandomChoice(weightedCollections);
}

async function loadNextItem() {
  // Clear any existing spinner timeout
  if (spinnerTimeout) {
    clearTimeout(spinnerTimeout);
    spinnerTimeout = null;
  }

  // Start loading state
  isLoading.value = true;
  showSpinner.value = false;

  // Show spinner after 500ms if still loading
  spinnerTimeout = setTimeout(() => {
    showSpinner.value = true;
  }, 500);

  // Store temp variables for the next item
  let nextItem: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null = null;
  let nextItemType: 'flashcard' | 'concept' | 'list' | 'cloze' | null = null;

  // Calculate active collections (all collections minus excluded ones)
  const allCollectionIds = collections.value.map(c => c.id!);
  const activeCollectionIds = allCollectionIds.filter(
    id => !filters.value.excludedCollectionIds.includes(id)
  );

  if (activeCollectionIds.length === 0) {
    // Clear spinner and finish loading
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
    showSpinner.value = false;
    isLoading.value = false;
    currentItem.value = null;
    currentItemType.value = null;
    return;
  }

  // Calculate active types (all types minus excluded ones)
  const allTypes: ('flashcard' | 'concept' | 'list' | 'cloze')[] = ['flashcard', 'concept', 'list', 'cloze'];
  const activeTypes = allTypes.filter(
    type => !filters.value.excludedItemTypes.includes(type)
  );

  if (activeTypes.length === 0) {
    // Clear spinner and finish loading
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
    showSpinner.value = false;
    isLoading.value = false;
    currentItem.value = null;
    currentItemType.value = null;
    return;
  }

  // 15% chance to prioritize new items over due items
  const prioritizeNew = Math.random() < 0.15;

  const shuffledTypes = [...activeTypes].sort(() => Math.random() - 0.5);

  for (const itemType of shuffledTypes) {
    const now = new Date();

    if (itemType === 'flashcard') {
      // Try weighted collection selection first
      const selectedCollectionId = selectWeightedCollection(activeCollectionIds, 'flashcard');

      if (selectedCollectionId) {
        if (prioritizeNew) {
          // Try to get a new flashcard from selected collection
          const allProgress = await learningProgressRepo.getAllProgressForItems(
            flashcards.value.map(f => f.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newFlashcard = await simpleFlashcardRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newFlashcard) {
            nextItem = newFlashcard;
            nextItemType = 'flashcard';
            break;
          }

          // Fallback to due flashcard from selected collection
          const dueFlashcard = await simpleFlashcardRepo.getRandomDue([selectedCollectionId], now);
          if (dueFlashcard) {
            nextItem = dueFlashcard;
            nextItemType = 'flashcard';
            break;
          }
        } else {
          // Try to get a due flashcard from selected collection
          const dueFlashcard = await simpleFlashcardRepo.getRandomDue([selectedCollectionId], now);
          if (dueFlashcard) {
            nextItem = dueFlashcard;
            nextItemType = 'flashcard';
            break;
          }

          // Fallback to new flashcard from selected collection
          const allProgress = await learningProgressRepo.getAllProgressForItems(
            flashcards.value.map(f => f.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newFlashcard = await simpleFlashcardRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newFlashcard) {
            nextItem = newFlashcard;
            nextItemType = 'flashcard';
            break;
          }
        }
      }

      // Fallback: pool all collections (if weighted selection found nothing)
      if (prioritizeNew) {
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          flashcards.value.map(f => f.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newFlashcard = await simpleFlashcardRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newFlashcard) {
          nextItem = newFlashcard;
          nextItemType = 'flashcard';
          break;
        }

        const dueFlashcard = await simpleFlashcardRepo.getRandomDue(activeCollectionIds, now);
        if (dueFlashcard) {
          nextItem = dueFlashcard;
          nextItemType = 'flashcard';
          break;
        }
      } else {
        const dueFlashcard = await simpleFlashcardRepo.getRandomDue(activeCollectionIds, now);
        if (dueFlashcard) {
          nextItem = dueFlashcard;
          nextItemType = 'flashcard';
          break;
        }

        const allProgress = await learningProgressRepo.getAllProgressForItems(
          flashcards.value.map(f => f.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newFlashcard = await simpleFlashcardRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newFlashcard) {
          nextItem = newFlashcard;
          nextItemType = 'flashcard';
          break;
        }
      }
    } else if (itemType === 'concept') {
      // Try weighted collection selection first
      const selectedCollectionId = selectWeightedCollection(activeCollectionIds, 'concept');

      if (selectedCollectionId) {
        if (prioritizeNew) {
          const allProgress = await learningProgressRepo.getAllProgressForItems(
            concepts.value.map(c => c.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newConcept = await elaborativeInterrogationRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newConcept) {
            nextItem = newConcept;
            nextItemType = 'concept';
            break;
          }

          const dueConcept = await elaborativeInterrogationRepo.getRandomDue([selectedCollectionId], now);
          if (dueConcept) {
            nextItem = dueConcept;
            nextItemType = 'concept';
            break;
          }
        } else {
          const dueConcept = await elaborativeInterrogationRepo.getRandomDue([selectedCollectionId], now);
          if (dueConcept) {
            nextItem = dueConcept;
            nextItemType = 'concept';
            break;
          }

          const allProgress = await learningProgressRepo.getAllProgressForItems(
            concepts.value.map(c => c.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newConcept = await elaborativeInterrogationRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newConcept) {
            nextItem = newConcept;
            nextItemType = 'concept';
            break;
          }
        }
      }

      // Fallback: pool all collections
      if (prioritizeNew) {
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          concepts.value.map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newConcept = await elaborativeInterrogationRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newConcept) {
          nextItem = newConcept;
          nextItemType = 'concept';
          break;
        }

        const dueConcept = await elaborativeInterrogationRepo.getRandomDue(activeCollectionIds, now);
        if (dueConcept) {
          nextItem = dueConcept;
          nextItemType = 'concept';
          break;
        }
      } else {
        const dueConcept = await elaborativeInterrogationRepo.getRandomDue(activeCollectionIds, now);
        if (dueConcept) {
          nextItem = dueConcept;
          nextItemType = 'concept';
          break;
        }

        const allProgress = await learningProgressRepo.getAllProgressForItems(
          concepts.value.map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newConcept = await elaborativeInterrogationRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newConcept) {
          nextItem = newConcept;
          nextItemType = 'concept';
          break;
        }
      }
    } else if (itemType === 'list') {
      // Try weighted collection selection first
      const selectedCollectionId = selectWeightedCollection(activeCollectionIds, 'list');

      if (selectedCollectionId) {
        if (prioritizeNew) {
          const allProgress = await learningProgressRepo.getAllProgressForItems(
            lists.value.map(l => l.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newList = await listRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newList) {
            nextItem = newList;
            nextItemType = 'list';
            break;
          }

          const dueList = await listRepo.getRandomDue([selectedCollectionId], now);
          if (dueList) {
            nextItem = dueList;
            nextItemType = 'list';
            break;
          }
        } else {
          const dueList = await listRepo.getRandomDue([selectedCollectionId], now);
          if (dueList) {
            nextItem = dueList;
            nextItemType = 'list';
            break;
          }

          const allProgress = await learningProgressRepo.getAllProgressForItems(
            lists.value.map(l => l.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newList = await listRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newList) {
            nextItem = newList;
            nextItemType = 'list';
            break;
          }
        }
      }

      // Fallback: pool all collections
      if (prioritizeNew) {
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          lists.value.map(l => l.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newList = await listRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newList) {
          nextItem = newList;
          nextItemType = 'list';
          break;
        }

        const dueList = await listRepo.getRandomDue(activeCollectionIds, now);
        if (dueList) {
          nextItem = dueList;
          nextItemType = 'list';
          break;
        }
      } else {
        const dueList = await listRepo.getRandomDue(activeCollectionIds, now);
        if (dueList) {
          nextItem = dueList;
          nextItemType = 'list';
          break;
        }

        const allProgress = await learningProgressRepo.getAllProgressForItems(
          lists.value.map(l => l.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newList = await listRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newList) {
          nextItem = newList;
          nextItemType = 'list';
          break;
        }
      }
    } else if (itemType === 'cloze') {
      // Try weighted collection selection first
      const selectedCollectionId = selectWeightedCollection(activeCollectionIds, 'cloze');

      if (selectedCollectionId) {
        if (prioritizeNew) {
          const allProgress = await learningProgressRepo.getAllProgressForItems(
            clozes.value.map(c => c.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newCloze = await clozeRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newCloze) {
            nextItem = newCloze;
            nextItemType = 'cloze';
            break;
          }

          const dueCloze = await clozeRepo.getRandomDue([selectedCollectionId], now);
          if (dueCloze) {
            nextItem = dueCloze;
            nextItemType = 'cloze';
            break;
          }
        } else {
          const dueCloze = await clozeRepo.getRandomDue([selectedCollectionId], now);
          if (dueCloze) {
            nextItem = dueCloze;
            nextItemType = 'cloze';
            break;
          }

          const allProgress = await learningProgressRepo.getAllProgressForItems(
            clozes.value.map(c => c.id!)
          );
          const existingIds = allProgress.map(p => p.learningItemId);
          const newCloze = await clozeRepo.getRandomNew([selectedCollectionId], existingIds);
          if (newCloze) {
            nextItem = newCloze;
            nextItemType = 'cloze';
            break;
          }
        }
      }

      // Fallback: pool all collections
      if (prioritizeNew) {
        const allProgress = await learningProgressRepo.getAllProgressForItems(
          clozes.value.map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newCloze = await clozeRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newCloze) {
          nextItem = newCloze;
          nextItemType = 'cloze';
          break;
        }

        const dueCloze = await clozeRepo.getRandomDue(activeCollectionIds, now);
        if (dueCloze) {
          nextItem = dueCloze;
          nextItemType = 'cloze';
          break;
        }
      } else {
        const dueCloze = await clozeRepo.getRandomDue(activeCollectionIds, now);
        if (dueCloze) {
          nextItem = dueCloze;
          nextItemType = 'cloze';
          break;
        }

        const allProgress = await learningProgressRepo.getAllProgressForItems(
          clozes.value.map(c => c.id!)
        );
        const existingIds = allProgress.map(p => p.learningItemId);
        const newCloze = await clozeRepo.getRandomNew(activeCollectionIds, existingIds);
        if (newCloze) {
          nextItem = newCloze;
          nextItemType = 'cloze';
          break;
        }
      }
    }
  }

  // Update state with the next item and finish loading
  if (spinnerTimeout) clearTimeout(spinnerTimeout);
  showSpinner.value = false;
  currentItem.value = nextItem;
  currentItemType.value = nextItemType;
  isLoading.value = false;
}

function openFilterModal() {
  filterModalRef.value?.open();
}

function handleFilterApply(newFilters: PracticeFilters) {
  filters.value = newFilters;
  saveFilters(newFilters);
  loadNextItem();
}

function handleEdit() {
  editModalRef.value?.open();
}

async function handleSaveEdit(data: unknown) {
  if (!currentItem.value?.id || !currentItemType.value) return;

  // Convert reactive Proxy to plain object
  const plainData = JSON.parse(JSON.stringify(data));

  // Update item based on type
  if (currentItemType.value === 'flashcard') {
    await simpleFlashcardRepo.update(currentItem.value.id, plainData as Partial<SimpleFlashcard>);
  } else if (currentItemType.value === 'concept') {
    await elaborativeInterrogationRepo.update(currentItem.value.id, plainData as Partial<ElaborativeInterrogationConcept>);
  } else if (currentItemType.value === 'list') {
    await listRepo.update(currentItem.value.id, plainData as Partial<List>);
  } else if (currentItemType.value === 'cloze') {
    await clozeRepo.update(currentItem.value.id, plainData as Partial<Cloze>);
  }

  // Reload current item to reflect changes (don't advance to next)
  await reloadCurrentItem();
}

async function reloadCurrentItem() {
  if (!currentItem.value?.id || !currentItemType.value) return;

  if (currentItemType.value === 'flashcard') {
    const updated = await simpleFlashcardRepo.getById(currentItem.value.id);
    if (updated) currentItem.value = updated;
  } else if (currentItemType.value === 'concept') {
    const updated = await elaborativeInterrogationRepo.getById(currentItem.value.id);
    if (updated) currentItem.value = updated;
  } else if (currentItemType.value === 'list') {
    const updated = await listRepo.getById(currentItem.value.id);
    if (updated) currentItem.value = updated;
  } else if (currentItemType.value === 'cloze') {
    const updated = await clozeRepo.getById(currentItem.value.id);
    if (updated) currentItem.value = updated;
  }
}

async function handleDelete() {
  if (!currentItem.value?.id || !currentItemType.value) return;

  const confirmed = confirm('Are you sure you want to delete this item? This action cannot be undone.');
  if (!confirmed) return;

  const itemId = currentItem.value.id;

  // Delete based on type
  if (currentItemType.value === 'flashcard') {
    await simpleFlashcardRepo.delete(itemId);
  } else if (currentItemType.value === 'concept') {
    await elaborativeInterrogationRepo.delete(itemId);
  } else if (currentItemType.value === 'list') {
    await listRepo.delete(itemId);
  } else if (currentItemType.value === 'cloze') {
    await clozeRepo.delete(itemId);
  }

  // Load next item
  await loadNextItem();
}

async function handleDisable() {
  if (!currentItem.value?.id || currentItemType.value !== 'flashcard') return;

  const flashcard = currentItem.value as SimpleFlashcard;
  await simpleFlashcardRepo.update(flashcard.id!, {
    isDisabled: !flashcard.isDisabled,
  });

  // Load next item
  await loadNextItem();
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

