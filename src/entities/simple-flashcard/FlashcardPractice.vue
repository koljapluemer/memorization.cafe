<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />

    <div
      v-if="!revealed && practiceMode === 'flashcard'"
      class="flex justify-center"
    >
      <button
        class="btn"
        @click="revealed = true"
      >
        Reveal
      </button>
    </div>

    <div
      v-if="!revealed && practiceMode === 'prompt'"
      class="space-y-2"
    >
      <textarea
        v-model="userResponse"
        placeholder="Type your response here..."
        class="textarea textarea-bordered w-full h-32"
        @keydown.enter.ctrl="handleDone"
      />
      <div class="flex justify-center">
        <button
          class="btn"
          :disabled="userResponse.trim().length === 0"
          @click="handleDone"
        >
          Done
        </button>
      </div>
    </div>

    <template v-if="revealed">
      <div class="divider" />

      <div
        v-if="practiceMode === 'prompt' && userResponse.trim().length > 0"
        class="mb-4"
      >
        <div
          v-if="answersMatch"
          class="border rounded-lg p-4 relative"
        >
          <div class="absolute top-4 right-4 text-success">
            <Check :size="24" />
          </div>
          <h4 class="font-semibold mb-2 text-sm">
            Your Answer / Correct Answer
          </h4>
          <MarkdownText :text="flashcard.back" />
        </div>
        <div
          v-else
          class="grid grid-cols-2 gap-4"
        >
          <div class="border rounded-lg p-4">
            <h4 class="font-semibold mb-2 text-sm">
              Your Answer
            </h4>
            <div class="whitespace-pre-wrap text-sm">
              {{ userResponse }}
            </div>
          </div>
          <div class="border rounded-lg p-4">
            <h4 class="font-semibold mb-2 text-sm">
              Correct Answer
            </h4>
            <MarkdownText :text="flashcard.back" />
          </div>
        </div>
      </div>

      <MarkdownText
        v-else
        :text="flashcard.back"
      />

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
import { ref, computed, onMounted } from 'vue';
import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';
import { Check } from 'lucide-vue-next';

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
const userResponse = ref('');
const practiceMode = ref<'flashcard' | 'prompt'>('flashcard');
const f = fsrs();

const answersMatch = computed(() => {
  // Normalize both answers for comparison: trim whitespace and convert to lowercase
  const userAnswer = userResponse.value.trim().toLowerCase();
  const correctAnswer = props.flashcard.back.trim().toLowerCase();
  return userAnswer === correctAnswer;
});

onMounted(async () => {
  // Determine practice mode
  const practiceAsFlashcard = props.flashcard.practiceAsFlashcard ?? true;
  const practiceAsPrompt = props.flashcard.practiceAsPrompt ?? false;

  // Check if this is a new flashcard (never practiced before)
  const progress = await learningProgressRepo.getByLearningItemId(props.flashcard.id!);
  const isNew = !progress || !progress.cardData;

  if (practiceAsFlashcard && practiceAsPrompt) {
    // Both modes enabled
    if (isNew) {
      // For new flashcards, always use flashcard mode
      practiceMode.value = 'flashcard';
    } else {
      // For reviewed flashcards, randomly choose
      practiceMode.value = Math.random() < 0.5 ? 'flashcard' : 'prompt';
    }
  } else if (practiceAsPrompt) {
    practiceMode.value = 'prompt';
  } else {
    practiceMode.value = 'flashcard';
  }
});

function handleDone() {
  if (userResponse.value.trim().length > 0) {
    revealed.value = true;
  }
}

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
