<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />

    <div
      v-if="!revealed"
      class="flex justify-center"
    >
      <button
        class="btn"
        @click="revealed = true"
      >
        Reveal
      </button>
    </div>

    <template v-if="revealed">
      <div class="divider" />
      <MarkdownText :text="flashcard.back" />

      <div class="flex gap-2 justify-center mt-4">
        <button
          class="btn"
          @click="handleRating(Rating.Again)"
        >
          Again
        </button>
        <button
          class="btn"
          @click="handleRating(Rating.Hard)"
        >
          Hard
        </button>
        <button
          class="btn"
          @click="handleRating(Rating.Good)"
        >
          Good
        </button>
        <button
          class="btn"
          @click="handleRating(Rating.Easy)"
        >
          Easy
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';

import type { SimpleFlashcard } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { learningProgressRepo } from '@/entities/learning-progress';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const revealed = ref(false);
const f = fsrs();

async function handleRating(rating: Rating) {
  const progress = await learningProgressRepo.getByLearningItemId(props.flashcard.id!);

  let card;
  if (progress && progress.cardData) {
    card = progress.cardData;
  } else {
    card = createEmptyCard();
  }

  const schedulingCards = f.repeat(card, new Date());
  const updatedCard = schedulingCards[rating as Exclude<Rating, Rating.Manual>].card;

  if (progress) {
    await learningProgressRepo.updateFlashcardProgress(props.flashcard.id!, updatedCard);
  } else {
    await learningProgressRepo.createFlashcardProgress(props.flashcard.id!, updatedCard);
  }

  emit('complete');
}
</script>
