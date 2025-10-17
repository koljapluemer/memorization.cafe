<template>
  <span>{{ truncatedFront }} | {{ truncatedBack }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { SimpleFlashcard } from '@/app/database';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

function truncate(text: string, maxLength: number = 20): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const truncatedFront = computed(() => truncate(props.flashcard.front));
const truncatedBack = computed(() => truncate(props.flashcard.back));
</script>
