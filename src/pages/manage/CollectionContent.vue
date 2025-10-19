<template>
  <div>
    <!-- Collection Actions (Collapsible) -->
    <details class="collapse collapse-arrow bg-base-200 mb-4">
      <summary class="collapse-title font-medium">
        Collection Actions
      </summary>
      <div class="collapse-content space-y-2">
        <button
          class="btn btn-sm"
          @click="$emit('edit-collection')"
        >
          <Edit :size="16" /> Edit Collection
        </button>
        <button
          class="btn btn-sm btn-error"
          @click="$emit('delete-collection')"
        >
          <Trash2 :size="16" /> Delete Collection
        </button>
      </div>
    </details>

    <!-- Add Learning Items -->
    <div class="flex gap-2 mb-4">
      <button
        class="btn btn-sm"
        @click="$emit('add-item', 'flashcard')"
      >
        + Flashcard
      </button>
      <button
        class="btn btn-sm"
        @click="$emit('add-item', 'concept')"
      >
        + Elaborative Interrogation Concept
      </button>
      <button
        class="btn btn-sm"
        @click="$emit('add-item', 'list')"
      >
        + List
      </button>
      <button
        class="btn btn-sm"
        @click="$emit('add-item', 'cloze')"
      >
        + Cloze
      </button>
    </div>

    <!-- Learning Items Table -->
    <LearningItemsTable
      :items="learningItems"
      @edit="(type, item) => $emit('edit-item', type, item)"
      @delete="(type, id) => $emit('delete-item', type, id)"
      @preview="(type, item) => $emit('preview-item', type, item)"
      @move="(type, item) => $emit('move-item', type, item)"
    />
  </div>
</template>

<script setup lang="ts">
import { Edit, Trash2 } from 'lucide-vue-next';

import LearningItemsTable, { type LearningItem } from './LearningItemsTable.vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import type { Collection } from '@/entities/collection';

defineProps<{
  collection: Collection;
  learningItems: LearningItem[];
}>();

defineEmits<{
  'edit-collection': [];
  'delete-collection': [];
  'add-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze'];
  'edit-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
  'delete-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', id: string];
  'preview-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
  'move-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
}>();
</script>
