<template>
  <div class="flex flex-col items-center justify-center py-16 space-y-4">
    <p class="text-lg text-gray-600">
      No collections open
    </p>
    <div class="flex gap-2">
      <button
        class="btn btn-primary"
        @click="$emit('new-collection')"
      >
        <Plus :size="16" /> New Collection
      </button>
      <button
        v-if="hasCollections"
        class="btn btn-primary"
        @click="$emit('open-collection')"
      >
        <FolderOpen :size="16" /> Open Collection
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, FolderOpen } from 'lucide-vue-next';

defineProps<{
  hasCollections: boolean;
}>();

defineEmits<{
  'open-collection': [];
  'new-collection': [];
}>();
</script>
