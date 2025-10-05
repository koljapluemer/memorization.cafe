<template>
  <div class="space-y-8">
    <FlashcardStudy
      :repository="repository"
    />
    <FlashcardCrud
      :repository="repository"
    />
  </div>
</template>

<script setup lang="ts">
import { useFlashcardRepository } from '../../app/providers';
import FlashcardCrud from '../../features/flashcard-crud/FlashcardCrud.vue';
import FlashcardStudy from '../../features/flashcard-study/FlashcardStudy.vue';

const repository = useFlashcardRepository();
</script>
