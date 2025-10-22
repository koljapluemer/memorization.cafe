<template>
  <div class="space-y-4">
    <div class="flex justify-start">
      <button
        class="btn btn-xs"
        @click="handleDisable"
      >
        Disable Exercise
      </button>
    </div>

    <MarkdownText :text="currentQuestion" />

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
          <MarkdownText :text="currentAnswer" />
        </div>
        <div
          v-else
          class="flex gap-2 flex-row flex-wrap"
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
            <MarkdownText :text="currentAnswer" />
          </div>
        </div>
      </div>

      <MarkdownText
        v-else
        :text="currentAnswer"
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
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const revealed = ref(false);
const userResponse = ref('');
const practiceMode = ref<'flashcard' | 'prompt'>('flashcard');
const isReversed = ref(false);
const f = fsrs();

const currentQuestion = computed(() =>
  isReversed.value ? props.flashcard.back : props.flashcard.front
);

const currentAnswer = computed(() =>
  isReversed.value ? props.flashcard.front : props.flashcard.back
);

const answersMatch = computed(() => {
  // Normalize both answers for comparison: trim whitespace and convert to lowercase
  const userAnswer = userResponse.value.trim().toLowerCase();
  const correctAnswer = currentAnswer.value.trim().toLowerCase();
  return userAnswer === correctAnswer;
});

onMounted(async () => {
  // Determine practice mode
  const practiceAsFlashcard = props.flashcard.practiceAsFlashcard ?? true;
  const practiceAsPrompt = props.flashcard.practiceAsPrompt ?? false;

  // Check if this is a new flashcard (never practiced before)
  const progress = await learningProgressRepo.getByLearningItemId(props.flashcard.id!);
  const isNew = !progress || !progress.cardData;

  // Determine practice mode
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

  // Determine direction (front→back or back→front)
  if (props.flashcard.practiceReverse) {
    if (isNew) {
      isReversed.value = false; // New cards always front→back
    } else {
      isReversed.value = Math.random() < 0.5; // 50/50 for reviewed cards
    }
  } else {
    isReversed.value = false; // Always front→back when reverse not enabled
  }
});

function handleDone() {
  if (userResponse.value.trim().length > 0) {
    revealed.value = true;
  }
}

async function handleDisable() {
  if (!props.flashcard.id) return;

  await simpleFlashcardRepo.update(props.flashcard.id, { isDisabled: true });
  emit('complete');
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
