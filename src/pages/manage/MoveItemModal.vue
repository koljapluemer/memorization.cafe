<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        Move to Collection
      </h3>

      <div class="space-y-4">
        <div class="form-control w-full">
          <label
            for="new-collection-name"
            class="label"
          >
            <span class="label-text">Create New Collection</span>
          </label>
          <div class="flex gap-2">
            <input
              id="new-collection-name"
              v-model="newCollectionName"
              type="text"
              placeholder="New collection name"
              class="input input-bordered flex-1"
              @keydown.enter="handleCreateAndMove"
            >
            <button
              class="btn btn-primary"
              :disabled="!newCollectionName.trim()"
              @click="handleCreateAndMove"
            >
              Create & Move
            </button>
          </div>
        </div>

        <div class="divider">
          OR
        </div>

        <div>
          <label class="label">
            <span class="label-text">Move to Existing Collection</span>
          </label>
          <div class="space-y-2">
            <button
              v-for="collection in existingCollections"
              :key="collection.id"
              class="btn btn-outline w-full justify-start"
              @click="handleMoveToExisting(collection)"
            >
              {{ collection.name }}
            </button>
            <div
              v-if="existingCollections.length === 0"
              class="text-sm text-base-content/50 text-center py-4"
            >
              <span>No other collections available</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn"
          @click="close"
        >
          Cancel
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Collection } from '@/entities/collection/Collection';

defineProps<{
  existingCollections: Collection[];
}>();

const emit = defineEmits<{
  move: [targetCollectionId: string];
  createAndMove: [newCollectionName: string];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const newCollectionName = ref('');

function open() {
  newCollectionName.value = '';
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function handleMoveToExisting(collection: Collection) {
  if (collection.id) {
    emit('move', collection.id);
    close();
  }
}

function handleCreateAndMove() {
  if (!newCollectionName.value.trim()) return;

  emit('createAndMove', newCollectionName.value);
  close();
}

defineExpose({ open });
</script>
