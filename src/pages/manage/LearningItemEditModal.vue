<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        {{ title }}
      </h3>

      <SimpleFlashcardEdit
        v-if="itemType === 'flashcard'"
        :flashcard="(item as SimpleFlashcard | undefined)"
        @update="handleUpdate"
      />

      <ElaborativeInterrogationEdit
        v-else-if="itemType === 'concept'"
        :concept="(item as ElaborativeInterrogationConcept | undefined)"
        @update="handleUpdate"
      />

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
import { ref, computed } from 'vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept } from '@/app/database';
import { ElaborativeInterrogationEdit } from '@/entities/elaborative-interrogation';
import { SimpleFlashcardEdit } from '@/entities/simple-flashcard';

const props = defineProps<{
  itemType: 'flashcard' | 'concept';
  item?: SimpleFlashcard | ElaborativeInterrogationConcept;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: unknown];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localData = ref<unknown>({});

const title = computed(() => {
  if (props.isNew) {
    return props.itemType === 'flashcard' ? 'New Flashcard' : 'New Concept';
  }
  return props.itemType === 'flashcard' ? 'Edit Flashcard' : 'Edit Concept';
});

function open() {
  localData.value = {};
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function handleUpdate(data: unknown) {
  localData.value = data;
}

function handleSave() {
  emit('save', localData.value);
  close();
}

defineExpose({ open });
</script>
