<template>
  <div>
    <!-- Collection Actions (Collapsible) -->
    <details class="collapse collapse-arrow bg-base-200 mb-4">
      <summary class="collapse-title font-medium">
        Collection Actions
      </summary>
      <div class="collapse-content space-y-4">
        <div class="flex gap-2">
          <button
            class="btn btn-sm"
            @click="$emit('edit-collection')"
          >
            <Edit :size="16" /> Edit Collection
          </button>
          <button
            class="btn btn-sm"
            @click="$emit('share-collection')"
          >
            <Share2 :size="16" /> Share Collection
          </button>
          <button
            class="btn btn-sm"
            @click="$emit('delete-collection')"
          >
            <Trash2 :size="16" /> Delete Collection
          </button>
        </div>

        <div class="divider" />

        <div>
          <h4 class="font-semibold mb-2 text-sm">
            Import/Export Learning Items
          </h4>
          <CsvImportExportTable
            @download-example="handleDownloadExample"
            @import-csv="handleImportCsv"
          />
        </div>
      </div>
    </details>

    <!-- Add Learning Items -->
    <div class="flex-col md:flex-row flex gap-2 mb-4 flex-wrap">
      <button
        class="btn btn-sm text-left flex justify-start"
        @click="$emit('add-item', 'flashcard')"
      >
        + Flashcard
      </button>
      <button
        class="btn btn-sm text-left flex justify-start"
        @click="$emit('add-item', 'concept')"
      >
        + Concept
      </button>
      <button
        class="btn btn-sm text-left flex justify-start"
        @click="$emit('add-item', 'list')"
      >
        + List
      </button>
      <button
        class="btn btn-sm text-left flex justify-start"
        @click="$emit('add-item', 'cloze')"
      >
        + Cloze
      </button>
    </div>

    <!-- Search and Sort Controls -->
    <div class="flex gap-2 mb-4 flex-col sm:flex-row">
      <input
        type="text"
        placeholder="Search items..."
        class="input input-bordered input-sm flex-grow"
        :value="searchQuery"
        @input="emit('update:search-query', ($event.target as HTMLInputElement).value)"
      >
      <select
        class="select select-bordered select-sm w-full sm:w-auto"
        :value="sortBy"
        @change="emit('update:sort-by', ($event.target as HTMLSelectElement).value)"
      >
        <option value="date-added-desc">
          Date Added (Newest First)
        </option>
        <option value="date-added-asc">
          Date Added (Oldest First)
        </option>
        <option value="last-practiced-desc">
          Last Practiced (Recent First)
        </option>
        <option value="last-practiced-asc">
          Last Practiced (Oldest First)
        </option>
        <option value="alphabetical-asc">
          Alphabetical (A-Z)
        </option>
        <option value="alphabetical-desc">
          Alphabetical (Z-A)
        </option>
        <option value="type">
          By Type
        </option>
      </select>
    </div>

    <!-- Learning Items Table -->
    <LearningItemsTable
      :items="learningItems"
      @edit="(type, item) => $emit('edit-item', type, item)"
      @delete="(type, id) => $emit('delete-item', type, id)"
      @preview="(type, item) => $emit('preview-item', type, item)"
      @move="(type, item) => $emit('move-item', type, item)"
      @show-progress="(type, item) => $emit('show-progress', type, item)"
    />
  </div>
</template>

<script setup lang="ts">
import { Edit, Share2, Trash2 } from 'lucide-vue-next';

import LearningItemsTable, { type LearningItem } from './LearningItemsTable.vue';
import CsvImportExportTable from './CsvImportExportTable.vue';
import type { EntityType } from './csv-utils';

import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';
import type { Collection } from '@/entities/collection/Collection';

defineProps<{
  collection: Collection;
  learningItems: LearningItem[];
  searchQuery: string;
  sortBy: string;
}>();

const emit = defineEmits<{
  'edit-collection': [];
  'share-collection': [];
  'delete-collection': [];
  'add-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze'];
  'edit-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | Concept | List | Cloze];
  'delete-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', id: string];
  'preview-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | Concept | List | Cloze];
  'move-item': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | Concept | List | Cloze];
  'show-progress': [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | Concept | List | Cloze];
  'download-example-csv': [type: EntityType];
  'import-csv': [type: EntityType];
  'update:search-query': [value: string];
  'update:sort-by': [value: string];
}>();

function handleDownloadExample(type: EntityType) {
  emit('download-example-csv', type);
}

function handleImportCsv(type: EntityType) {
  emit('import-csv', type);
}
</script>
