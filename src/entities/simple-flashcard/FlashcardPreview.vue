<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />
    <div class="divider" />
    <MarkdownText :text="flashcard.back" />
    <div
      v-if="flashcard.practiceReverse"
      class="flex items-center gap-2 text-sm text-base-content/70 mt-2"
    >
      <ArrowLeftRight :size="14" />
      <span>Card will also be reverse-practiced</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftRight } from 'lucide-vue-next';

import type { SimpleFlashcard } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  flashcard: SimpleFlashcard;
}>();
</script>
