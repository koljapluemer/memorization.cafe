<template>
  <span :class="{ 'opacity-50': flashcard.isDisabled }">
    <CircleSlash
      v-if="flashcard.isDisabled"
      :size="14"
      class="inline mr-1"
    />
    <Image
      v-if="hasImage"
      :size="14"
      class="inline mr-1"
    />
    {{ truncatedFront }} | {{ truncatedBack }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CircleSlash, Image } from 'lucide-vue-next';

import type { SimpleFlashcard } from './SimpleFlashcard';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

function truncate(text: string, maxLength: number = 20): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const truncatedFront = computed(() => truncate(props.flashcard.front));
const truncatedBack = computed(() => truncate(props.flashcard.back));
const hasImage = computed(() => Boolean(props.flashcard.frontImage || props.flashcard.backImage));
</script>
