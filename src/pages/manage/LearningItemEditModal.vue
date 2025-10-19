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

      <ListEdit
        v-else-if="itemType === 'list'"
        :list="(item as List | undefined)"
        @update="handleUpdate"
      />

      <ClozeEdit
        v-else-if="itemType === 'cloze'"
        :cloze="(item as Cloze | undefined)"
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

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { ElaborativeInterrogationEdit } from '@/entities/elaborative-interrogation';
import { SimpleFlashcardEdit } from '@/entities/simple-flashcard';
import { ListEdit } from '@/entities/list';
import { ClozeEdit } from '@/entities/cloze';

const props = defineProps<{
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  item?: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: unknown];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localData = ref<unknown>({});

const title = computed(() => {
  if (props.isNew) {
    if (props.itemType === 'flashcard') return 'New Flashcard';
    if (props.itemType === 'concept') return 'New Concept';
    if (props.itemType === 'list') return 'New List';
    if (props.itemType === 'cloze') return 'New Cloze';
  }
  if (props.itemType === 'flashcard') return 'Edit Flashcard';
  if (props.itemType === 'concept') return 'Edit Concept';
  if (props.itemType === 'list') return 'Edit List';
  if (props.itemType === 'cloze') return 'Edit Cloze';
  return '';
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
