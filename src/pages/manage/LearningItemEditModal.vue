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
        :key="componentKey"
        :flashcard="(item as SimpleFlashcard | undefined)"
        @update="handleUpdate"
      />

      <ConceptEdit
        v-else-if="itemType === 'concept'"
        :key="componentKey"
        :concept="(item as Concept | undefined)"
        @update="handleUpdate"
      />

      <ListEdit
        v-else-if="itemType === 'list'"
        :key="componentKey"
        :list="(item as List | undefined)"
        @update="handleUpdate"
      />

      <ClozeEdit
        v-else-if="itemType === 'cloze'"
        :key="componentKey"
        :cloze="(item as Cloze | undefined)"
        @update="handleUpdate"
      />

      <div class="modal-action">
        <button
          v-if="isNew"
          class="btn"
          @click="handleSaveAndAddAnother"
        >
          Save & Add Another
        </button>
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

import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';
import ConceptEdit from '@/entities/concept/ConceptEdit.vue';
import SimpleFlashcardEdit from '@/entities/simple-flashcard/FlashcardEdit.vue';
import ListEdit from '@/entities/list/ListEdit.vue';
import ClozeEdit from '@/entities/cloze/ClozeEdit.vue';

const props = defineProps<{
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  item?: SimpleFlashcard | Concept | List | Cloze;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: unknown];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localData = ref<unknown>({});
const componentKey = ref(0);

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
  componentKey.value++; // Force component to remount
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

function handleSaveAndAddAnother() {
  emit('save', localData.value);
  // Reset form state without closing modal
  localData.value = {};
  componentKey.value++; // Force component to remount with fresh state
}

defineExpose({ open });
</script>
