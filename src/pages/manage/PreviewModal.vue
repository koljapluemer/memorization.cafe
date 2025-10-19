<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        Preview
      </h3>

      <SimpleFlashcardPreview
        v-if="itemType === 'flashcard'"
        :flashcard="(item as SimpleFlashcard)"
      />

      <ElaborativeInterrogationPreview
        v-else-if="itemType === 'concept'"
        :concept="(item as ElaborativeInterrogationConcept)"
      />

      <ListPreview
        v-else-if="itemType === 'list'"
        :list="(item as List)"
      />

      <div class="modal-action">
        <button
          class="btn"
          @click="close"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List } from '@/app/database';
import { ElaborativeInterrogationPreview } from '@/entities/elaborative-interrogation';
import { SimpleFlashcardPreview } from '@/entities/simple-flashcard';
import { ListPreview } from '@/entities/list';

defineProps<{
  itemType: 'flashcard' | 'concept' | 'list';
  item: SimpleFlashcard | ElaborativeInterrogationConcept | List;
}>();

const modalRef = ref<HTMLDialogElement | null>(null);

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

defineExpose({ open });
</script>
