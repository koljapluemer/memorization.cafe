<template>
  <div class="overflow-x-auto">
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Learning Item Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Flashcards</td>
          <td class="flex gap-2">
            <button
              class="btn btn-xs btn-outline"
              @click="$emit('download-example', 'flashcard')"
            >
              <Download :size="14" /> Example CSV
            </button>
            <button
              class="btn btn-xs btn-primary"
              @click="$emit('import-csv', 'flashcard')"
            >
              <Upload :size="14" /> Import CSV
            </button>
          </td>
        </tr>
        <tr>
          <td>Elaborative Interrogation Concepts</td>
          <td class="flex gap-2">
            <button
              class="btn btn-xs btn-outline"
              @click="$emit('download-example', 'concept')"
            >
              <Download :size="14" /> Example CSV
            </button>
            <button
              class="btn btn-xs btn-primary"
              @click="$emit('import-csv', 'concept')"
            >
              <Upload :size="14" /> Import CSV
            </button>
          </td>
        </tr>
        <tr>
          <td>Lists</td>
          <td class="flex gap-2">
            <button
              class="btn btn-xs btn-outline"
              @click="$emit('download-example', 'list')"
            >
              <Download :size="14" /> Example CSV
            </button>
            <button
              class="btn btn-xs btn-primary"
              @click="$emit('import-csv', 'list')"
            >
              <Upload :size="14" /> Import CSV
            </button>
          </td>
        </tr>
        <tr>
          <td>Clozes</td>
          <td class="flex gap-2">
            <button
              class="btn btn-xs btn-outline"
              @click="$emit('download-example', 'cloze')"
            >
              <Download :size="14" /> Example CSV
            </button>
            <button
              class="btn btn-xs btn-primary"
              @click="$emit('import-csv', 'cloze')"
            >
              <Upload :size="14" /> Import CSV
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next';

import type { EntityType } from './csv-utils';

defineEmits<{
  'download-example': [type: EntityType];
  'import-csv': [type: EntityType];
}>();
</script>
