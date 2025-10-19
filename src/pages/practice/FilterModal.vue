<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        Filter Practice Items
      </h3>

      <div class="space-y-6">
        <!-- Collections -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">Collections</span>
            <div class="space-x-2">
              <button
                class="btn btn-xs"
                @click="selectAllCollections"
              >
                Select All
              </button>
              <button
                class="btn btn-xs"
                @click="deselectAllCollections"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <label
              v-for="collection in collections"
              :key="collection.id"
              class="flex items-center gap-2"
            >
              <input
                v-model="selectedCollectionIds"
                type="checkbox"
                class="checkbox checkbox-sm"
                :value="collection.id"
              >
              <span>{{ collection.name }}</span>
            </label>
          </div>
        </div>

        <!-- Item Types -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">Item Types</span>
            <div class="space-x-2">
              <button
                class="btn btn-xs"
                @click="selectAllTypes"
              >
                Select All
              </button>
              <button
                class="btn btn-xs"
                @click="deselectAllTypes"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input
                v-model="selectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="flashcard"
              >
              <span>Flashcards</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="selectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="concept"
              >
              <span>Elaborative Interrogation</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="selectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="list"
              >
              <span>Lists</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="selectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="cloze"
              >
              <span>Clozes</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-primary"
          @click="handleApply"
        >
          Apply
        </button>
        <button
          class="btn"
          @click="close"
        >
          Cancel
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button @click="close">
        close
      </button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import type { PracticeFilters } from './filter-storage';

import type { Collection } from '@/entities/collection';

const props = defineProps<{
  collections: Collection[];
  currentFilters: PracticeFilters;
}>();

const emit = defineEmits<{
  apply: [filters: PracticeFilters];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localExcludedCollectionIds = ref<string[]>([]);
const localExcludedItemTypes = ref<('flashcard' | 'concept' | 'list' | 'cloze')[]>([]);

onMounted(() => {
  localExcludedCollectionIds.value = [...props.currentFilters.excludedCollectionIds];
  localExcludedItemTypes.value = [...props.currentFilters.excludedItemTypes];
});

// Computed properties that invert the exclusion logic for checkbox binding
const selectedCollectionIds = computed({
  get: () => {
    // Selected = all collections that are NOT excluded
    return props.collections
      .map(c => c.id!)
      .filter(id => !localExcludedCollectionIds.value.includes(id));
  },
  set: (newSelected: string[]) => {
    // Update excluded list to be all collections NOT in the selected list
    const allIds = props.collections.map(c => c.id!);
    localExcludedCollectionIds.value = allIds.filter(id => !newSelected.includes(id));
  },
});

const selectedItemTypes = computed({
  get: () => {
    // Selected = all types that are NOT excluded
    const allTypes: ('flashcard' | 'concept' | 'list' | 'cloze')[] = ['flashcard', 'concept', 'list', 'cloze'];
    return allTypes.filter(type => !localExcludedItemTypes.value.includes(type));
  },
  set: (newSelected: ('flashcard' | 'concept' | 'list' | 'cloze')[]) => {
    // Update excluded list to be all types NOT in the selected list
    const allTypes: ('flashcard' | 'concept' | 'list' | 'cloze')[] = ['flashcard', 'concept', 'list', 'cloze'];
    localExcludedItemTypes.value = allTypes.filter(type => !newSelected.includes(type));
  },
});

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function selectAllCollections() {
  // "Select All" means exclude nothing
  localExcludedCollectionIds.value = [];
}

function deselectAllCollections() {
  // "Deselect All" means exclude everything
  localExcludedCollectionIds.value = props.collections.map(c => c.id!);
}

function selectAllTypes() {
  // "Select All" means exclude nothing
  localExcludedItemTypes.value = [];
}

function deselectAllTypes() {
  // "Deselect All" means exclude everything
  localExcludedItemTypes.value = ['flashcard', 'concept', 'list', 'cloze'];
}

function handleApply() {
  emit('apply', {
    excludedCollectionIds: localExcludedCollectionIds.value,
    excludedItemTypes: localExcludedItemTypes.value,
  });
  close();
}

defineExpose({ open });
</script>
