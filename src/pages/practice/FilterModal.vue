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
                v-model="localSelectedCollectionIds"
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
                v-model="localSelectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="flashcard"
              >
              <span>Flashcards</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="localSelectedItemTypes"
                type="checkbox"
                class="checkbox checkbox-sm"
                value="concept"
              >
              <span>Elaborative Interrogation</span>
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
import { ref, onMounted } from 'vue';

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
