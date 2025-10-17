# Step 8: Practice Page Implementation

## Overview
Create the Practice page that randomly selects learning items (flashcards or concepts) based on due/new status and presents them to the user.

## Architecture Rules
- Location: `src/pages/practice/`
- Can import entities, features, and dumb components
- Page-specific components can live in the page folder

## Tasks

### 8.1 Create Filter State Management

Create `src/pages/practice/filter-storage.ts`:

```typescript
const STORAGE_KEY = 'practice-filters';

export interface PracticeFilters {
  selectedCollectionIds: string[];
  selectedItemTypes: ('flashcard' | 'concept')[];
}

export function loadFilters(): PracticeFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        selectedCollectionIds: [],
        selectedItemTypes: ['flashcard', 'concept'],
      };
    }
    return JSON.parse(stored);
  } catch {
    return {
      selectedCollectionIds: [],
      selectedItemTypes: ['flashcard', 'concept'],
    };
  }
}

export function saveFilters(filters: PracticeFilters): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}
```

### 8.2 Create Filter Modal Component

Create `src/pages/practice/FilterModal.vue`:

```vue
<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Filter Practice Items</h3>

      <div class="space-y-6">
        <!-- Collections -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">Collections</span>
            <div class="space-x-2">
              <button @click="selectAllCollections" class="btn btn-xs">Select All</button>
              <button @click="deselectAllCollections" class="btn btn-xs">Deselect All</button>
            </div>
          </div>
          <div class="space-y-2">
            <label v-for="collection in collections" :key="collection.id" class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                :value="collection.id"
                v-model="localSelectedCollectionIds"
              />
              <span>{{ collection.name }}</span>
            </label>
          </div>
        </div>

        <!-- Item Types -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">Item Types</span>
            <div class="space-x-2">
              <button @click="selectAllTypes" class="btn btn-xs">Select All</button>
              <button @click="deselectAllTypes" class="btn btn-xs">Deselect All</button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                value="flashcard"
                v-model="localSelectedItemTypes"
              />
              <span>Flashcards</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                value="concept"
                v-model="localSelectedItemTypes"
              />
              <span>Elaborative Interrogation</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button @click="handleApply" class="btn btn-primary">Apply</button>
        <button @click="close" class="btn">Cancel</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Collection } from '@/entities/collection';
import type { PracticeFilters } from './filter-storage';

const props = defineProps<{
  collections: Collection[];
  currentFilters: PracticeFilters;
}>();

const emit = defineEmits<{
  apply: [filters: PracticeFilters];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localSelectedCollectionIds = ref<string[]>([]);
const localSelectedItemTypes = ref<('flashcard' | 'concept')[]>([]);

onMounted(() => {
  localSelectedCollectionIds.value = [...props.currentFilters.selectedCollectionIds];
  localSelectedItemTypes.value = [...props.currentFilters.selectedItemTypes];
});

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function selectAllCollections() {
  localSelectedCollectionIds.value = props.collections.map(c => c.id!);
}

function deselectAllCollections() {
  localSelectedCollectionIds.value = [];
}

function selectAllTypes() {
  localSelectedItemTypes.value = ['flashcard', 'concept'];
}

function deselectAllTypes() {
  localSelectedItemTypes.value = [];
}

function handleApply() {
  emit('apply', {
    selectedCollectionIds: localSelectedCollectionIds.value,
    selectedItemTypes: localSelectedItemTypes.value,
  });
  close();
}

defineExpose({ open });
</script>
```

### 8.3 Create Practice Page

Create `src/pages/practice/PracticePage.vue`:

```vue
<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="currentItem && currentItemType">
      <SimpleFlashcardPractice
        v-if="currentItemType === 'flashcard'"
        :flashcard="currentItem"
        @complete="loadNextItem"
      />
      <ElaborativeInterrogationPractice
        v-else-if="currentItemType === 'concept'"
        :concept="currentItem"
        @complete="loadNextItem"
      />
    </div>

    <div v-else class="text-center py-12">
      <p class="text-lg">No items to practice right now.</p>
      <p class="text-sm text-gray-500 mt-2">Add some learning items or adjust your filters.</p>
    </div>

    <!-- Filter FAB -->
    <button
      @click="openFilterModal"
      class="btn btn-circle btn-primary fixed bottom-4 right-4"
      aria-label="Filter"
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
import { collectionRepo, type Collection } from '@/entities/collection';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';
import { elaborativeInterrogationRepo } from '@/entities/elaborative-interrogation';
import { learningProgressRepo } from '@/entities/learning-progress';
import { SimpleFlashcardPractice } from '@/entities/simple-flashcard';
import { ElaborativeInterrogationPractice } from '@/entities/elaborative-interrogation';
import { getRandomItem } from '@/dumb/array-utils';
import FilterModal from './FilterModal.vue';
import { loadFilters, saveFilters, type PracticeFilters } from './filter-storage';

const collections = ref<Collection[]>([]);
const filters = ref<PracticeFilters>(loadFilters());
const filterModalRef = ref<InstanceType<typeof FilterModal> | null>(null);

const currentItem = ref<any>(null);
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
```

## How It Works

1. **Random Item Selection**:
   - Randomly picks an item type (flashcard or concept) from enabled types
   - Tries to get a *random* due item for that type
   - If none, tries to get a *random* new/unseen item
   - If none, tries the next item type
   - If nothing found, shows "No items" message

2. **Filters**:
   - Filter by collections (multi-select)
   - Filter by item types (flashcard/concept)
   - Filters persist in localStorage
   - Default: all collections, all types enabled

3. **Practice Flow**:
   - Shows Practice component for current item
   - Waits for completion (user rates flashcard or submits concept answer)
   - Loads next item

## Validation

- [ ] Page loads and shows a practice item if available
- [ ] After completing an item, next item loads automatically
- [ ] Filter FAB appears in bottom-right corner
- [ ] Filter modal allows selecting/deselecting collections and item types
- [ ] Filters persist across page reloads (localStorage)
- [ ] Random selection works for both due and new items
- [ ] No progress bars or extra UI elements not in spec
- [ ] ESLint passes

## Next Step

Proceed to `09-manage-page.md` to implement the Manage page.
