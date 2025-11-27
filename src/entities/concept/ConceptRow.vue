<template>
  <span>
    <strong>{{ concept.name }}</strong>
    <template v-if="concept.description">
      {{ ' - ' + truncatedDescription }}
    </template>
    <span v-if="concept.priority && concept.priority !== 5" class="text-light ml-2">
      (priority: {{ concept.priority }})
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Concept } from './Concept';

const props = defineProps<{
  concept: Concept;
}>();

function truncate(text: string, maxLength: number = 40): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const truncatedDescription = computed(() =>
  props.concept.description ? truncate(props.concept.description) : ''
);
</script>
