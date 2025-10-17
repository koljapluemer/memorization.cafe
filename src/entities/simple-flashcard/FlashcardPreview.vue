<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />
    <div class="divider" />
    <MarkdownText :text="flashcard.back" />
  </div>
</template>

<script setup lang="ts">
import type { SimpleFlashcard } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  flashcard: SimpleFlashcard;
}>();
</script>
