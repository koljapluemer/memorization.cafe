<template>
  <div class="space-y-4">
    <div
      v-if="flashcard.frontImage"
      class="mb-4"
    >
      <img
        :src="flashcard.frontImage"
        class="max-w-sm rounded"
      >
      <MarkdownText
        v-if="flashcard.frontImageLabel"
        :text="flashcard.frontImageLabel"
        class="text-light mt-1"
      />
    </div>

    <MarkdownText :text="flashcard.front" />

    <div class="divider" />

    <div
      v-if="flashcard.backImage"
      class="mb-4"
    >
      <img
        :src="flashcard.backImage"
        class="max-w-sm rounded"
      >
      <MarkdownText
        v-if="flashcard.backImageLabel"
        :text="flashcard.backImageLabel"
        class="text-light mt-1"
      />
    </div>

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
