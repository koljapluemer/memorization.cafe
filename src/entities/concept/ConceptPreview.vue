<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">
      {{ concept.name }}
    </h2>
    <MarkdownText
      v-if="concept.description"
      :text="concept.description"
    />
    <p class="text-sm text-gray-500 mt-2">
      Practice will present random elaborative questions
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Concept } from './Concept';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  concept: Concept;
}>();
</script>
