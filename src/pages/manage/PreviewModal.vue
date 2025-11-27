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

      <ConceptPreview
        v-else-if="itemType === 'concept'"
        :concept="(item as Concept)"
      />

      <ListPreview
        v-else-if="itemType === 'list'"
        :list="(item as List)"
      />

      <ClozePreview
        v-else-if="itemType === 'cloze'"
        :cloze="(item as Cloze)"
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

import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';
import ConceptPreview from '@/entities/concept/ConceptPreview.vue';
import SimpleFlashcardPreview from '@/entities/simple-flashcard/FlashcardPreview.vue';
import ListPreview from '@/entities/list/ListPreview.vue';
import ClozePreview from '@/entities/cloze/ClozePreview.vue';

defineProps<{
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  item: SimpleFlashcard | Concept | List | Cloze;
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
