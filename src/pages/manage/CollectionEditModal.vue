<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        {{ isNew ? 'New Collection' : 'Edit Collection' }}
      </h3>

      <div class="space-y-4">
        <div class="form-control w-full">
          <label
            for="collection-name"
            class="label"
          >
            <span class="label-text">Name</span>
          </label>
          <input
            id="collection-name"
            v-model="localName"
            type="text"
            placeholder="Collection name"
            class="input input-bordered w-full"
          >
        </div>

        <div class="form-control w-full">
          <label
            for="collection-description"
            class="label"
          >
            <span class="label-text">Description (optional)</span>
          </label>
          <textarea
            id="collection-description"
            v-model="localDescription"
            placeholder="Collection description"
            class="textarea textarea-bordered w-full"
          />
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-primary"
          @click="handleSave"
        >
          Save
        </button>
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

import type { Collection } from '@/entities/collection';

const props = defineProps<{
  collection?: Collection;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: { name: string; description?: string }];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localName = ref('');
const localDescription = ref('');

function open(collection?: Collection) {
  // Use passed argument instead of props
  localName.value = collection?.name || '';
  localDescription.value = collection?.description || '';
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
  // Reset local state on close
  localName.value = '';
  localDescription.value = '';
}

function handleSave() {
  if (!localName.value.trim()) return;

  emit('save', {
    name: localName.value,
    description: localDescription.value || undefined,
  });
  close();
}

defineExpose({ open });
</script>
