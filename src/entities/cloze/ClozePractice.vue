<template>
  <!-- eslint-disable vue/no-v-html -->
  <PracticeLayout
    @skip="emit('skip')"
    @edit="emit('edit')"
    @delete="emit('delete')"
    @filter="emit('filter')"
  >
    <template #exercise>
      <MarkdownText
        v-if="cloze.preExercise"
        :text="cloze.preExercise"
      />

      <div
        v-if="!revealed"
        class="text-lg"
      >
        {{ clozedContent }}
      </div>

      <template v-if="revealed">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="text-lg"
          v-html="highlightedContent"
        />

        <MarkdownText
          v-if="cloze.postExercise"
          :text="cloze.postExercise"
        />
      </template>
    </template>

    <template #controls>
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

      <div
        v-if="revealed"
        class="flex gap-2 justify-center"
      >
        <template v-if="isNewItem">
          <button
            class="btn btn-primary"
            @click="handleIWillRemember"
          >
            I will remember
          </button>
          <button
            class="btn"
            @click="handleAlreadyKnowThis"
          >
            Already Know This
          </button>
        </template>
        <template v-else>
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
        </template>
      </div>
    </template>
  </PracticeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';

import type { Cloze } from './Cloze';

import MarkdownText from '@/dumb/MarkdownText.vue';
import { generateClozeText } from '@/dumb/cloze-utils';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import PracticeLayout from '@/pages/practice/PracticeLayout.vue';

const props = defineProps<{
  cloze: Cloze;
}>();

const emit = defineEmits<{
  complete: [];
  skip: [];
  edit: [];
  delete: [];
  filter: [];
  addToHotList: [itemId: string];
}>();

const revealed = ref(false);
const isNewItem = ref(false);
const f = fsrs();

// Get retrievability from existing progress
const retrievability = ref(0);

// Initialize retrievability from progress
(async () => {
  const progress = await learningProgressRepo.getByLearningItemId(props.cloze.id!);

  // Check if this is a new cloze
  isNewItem.value = !progress || !progress.cardData;

  // Auto-reveal for new items
  if (isNewItem.value) {
    revealed.value = true;
  }

  if (progress?.cardData) {
    // Calculate retrievability from card
    // For ts-fsrs, we can use the card's stability and elapsed time
    // For now, we'll use a simple heuristic based on state
    const card = progress.cardData;
    if (card.state === 0) retrievability.value = 0; // New
    else if (card.state === 1) retrievability.value = 0.5; // Learning
    else if (card.state === 2) retrievability.value = 0.8; // Review
    else retrievability.value = 0.9; // Relearning
  }
})();

// Generate the cloze
const clozeResult = computed(() => {
  return generateClozeText(
    props.cloze.content,
    props.cloze.indices,
    props.cloze.clozeStrategy,
    retrievability.value
  );
});

const clozedContent = computed(() => clozeResult.value.clozedText);

// Build highlighted content for reveal
const highlightedContent = computed(() => {
  const { content, clozeStrategy } = props.cloze;
  const { clozedIndices } = clozeResult.value;

  if (clozeStrategy === 'split') {
    // Highlight everything after the marker
    if (clozedIndices.length === 0) return escapeHtml(content);
    const markerIndex = clozedIndices[0]!;
    const before = escapeHtml(content.substring(0, markerIndex + 1));
    const after = escapeHtml(content.substring(markerIndex + 1));
    return `${before}<mark>${after}</mark>`;
  }

  if (clozeStrategy === 'atEveryCharacter') {
    // Highlight clozed characters
    let result = '';
    let inCloze = false;
    for (let i = 0; i < content.length; i++) {
      const shouldCloze = clozedIndices.includes(i);
      if (shouldCloze && !inCloze) {
        result += '<mark>';
        inCloze = true;
      } else if (!shouldCloze && inCloze) {
        result += '</mark>';
        inCloze = false;
      }
      result += escapeHtml(content[i]!);
    }
    if (inCloze) result += '</mark>';
    return result;
  }

  // atSpace: highlight clozed words
  const parts = content.split(/(\s+)/);
  const words: string[] = [];
  for (const part of parts) {
    if (part.trim() !== '') {
      words.push(part);
    }
  }

  let result = '';
  let wordIndex = 0;

  for (const part of parts) {
    if (part.trim() !== '') {
      // It's a word
      const shouldHighlight = clozedIndices.includes(wordIndex);
      if (shouldHighlight) {
        result += '<mark>' + escapeHtml(part) + '</mark>';
      } else {
        result += escapeHtml(part);
      }
      wordIndex++;
    } else {
      // It's a space
      result += part;
    }
  }

  return result;
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleIWillRemember() {
  const initialCard = createEmptyCard();

  await learningProgressRepo.createIntroductionProgress(
    props.cloze.id!,
    'cloze',
    { card: initialCard }
  );

  emit('addToHotList', props.cloze.id!);
  emit('complete');
}

async function handleAlreadyKnowThis() {
  const initialCard = createEmptyCard();

  await learningProgressRepo.createIntroductionProgress(
    props.cloze.id!,
    'cloze',
    { card: initialCard }
  );

  emit('complete');
}

async function handleRating(rating: Rating) {
  const progress = await learningProgressRepo.getByLearningItemId(props.cloze.id!);

  let card;
  if (progress && progress.cardData) {
    card = progress.cardData;
  } else {
    card = createEmptyCard();
  }

  const schedulingCards = f.repeat(card, new Date());
  const updatedCard = schedulingCards[rating as Exclude<Rating, Rating.Manual>].card;

  if (progress) {
    await learningProgressRepo.updateFlashcardProgress(props.cloze.id!, updatedCard);
  } else {
    await learningProgressRepo.createFlashcardProgress(props.cloze.id!, updatedCard);
  }

  emit('complete');
}
</script>
