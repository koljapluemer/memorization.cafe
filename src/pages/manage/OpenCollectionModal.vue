<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        Open Collection
      </h3>

      <div
        v-if="availableCollections.length === 0"
        class="text-center py-8 text-gray-500"
      >
        No collections available to open
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="collection in availableCollections"
          :key="collection.id"
          class="card bg-base-200 p-4 cursor-pointer hover:bg-base-300 transition-colors"
          @click="handleSelectCollection(collection.id!)"
        >
          <div class="font-semibold">
            {{ collection.name }}
          </div>
          <div
            v-if="collection.description"
            class="text-sm text-gray-600 mt-1"
          >
            {{ collection.description }}
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
import { ref, computed } from 'vue';

import type { Collection } from '@/entities/collection';

const props = defineProps<{
  collections: Collection[];
  openTabIds: string[];
}>();

const emit = defineEmits<{
  select: [collectionId: string];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);

const availableCollections = computed(() => {
  return props.collections.filter(c => !props.openTabIds.includes(c.id!));
});

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function handleSelectCollection(collectionId: string) {
  emit('select', collectionId);
  close();
}

defineExpose({ open });
</script>
