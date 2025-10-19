<template>
  <div class="flex items-center justify-between p-3 border border-base-300 rounded-lg">
    <div class="flex items-center gap-2">
      <span class="font-medium">{{ list.name }}</span>
      <span
        v-if="list.isDefault"
        class="badge badge-primary badge-sm"
      >Default</span>
    </div>
    <div class="flex gap-2">
      <button
        v-if="!list.isDefault"
        class="btn btn-xs btn-ghost"
        @click="$emit('set-default', list.id!)"
      >
        Set as Default
      </button>
      <button
        class="btn btn-xs btn-ghost"
        @click="$emit('edit', list)"
      >
        Edit
      </button>
      <button
        class="btn btn-xs btn-error btn-ghost"
        @click="$emit('delete', list.id!)"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuestionList } from '@/entities/question-list';

defineProps<{
  list: QuestionList;
}>();

defineEmits<{
  edit: [list: QuestionList];
  delete: [id: string];
  'set-default': [id: string];
}>();
</script>
