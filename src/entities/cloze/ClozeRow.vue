<template>
  <span>
    {{ displayText }}
    <span v-if="cloze.priority && cloze.priority !== 5" class="text-light ml-2">
      (priority: {{ cloze.priority }})
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Cloze } from './Cloze';
import { generateClozeText } from '@/dumb/cloze-utils';

const props = defineProps<{
  cloze: Cloze;
}>();

function truncate(text: string, maxLength: number = 50): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const displayText = computed(() => {
  const { clozedText } = generateClozeText(
    props.cloze.content,
    props.cloze.indices,
    props.cloze.clozeStrategy,
    0 // Low retrievability for preview
  );

  return truncate(clozedText);
});
</script>
