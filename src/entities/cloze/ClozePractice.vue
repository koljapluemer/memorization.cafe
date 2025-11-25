<template>
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
        <div
          class="text-lg"
          v-html="highlightedContent"
        />

        <MarkdownText
          v-if="cloze.postExercise"
          :text="cloze.postExercise"
        />

        <div
          v-if="existingHelperNote && !editingNote"
          class="mt-4 flex items-center gap-2"
        >
          <span>{{ existingHelperNote }}</span>
          <button
            class="btn btn-ghost btn-sm"
            @click="editingNote = true"
          >
            <Edit :size="16" />
          </button>
        </div>

        <fieldset
          v-if="(isNewItem && !existingHelperNote) || editingNote"
          class="fieldset mt-4"
        >
          <label class="label">Add a note on how you will remember this</label>
          <textarea
            v-model="helperNote"
            class="textarea textarea-bordered w-full h-24"
            @blur="saveHelperNote"
          />
        </fieldset>
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
  </PracticeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';
import { Edit } from 'lucide-vue-next';

import type { Cloze } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { generateClozeText } from '@/dumb/cloze-utils';
import { learningProgressRepo } from '@/entities/learning-progress';
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
}>();

const revealed = ref(false);
const helperNote = ref('');
const existingHelperNote = ref('');
const isNewItem = ref(false);
const editingNote = ref(false);
const f = fsrs();

// Get retrievability from existing progress
const retrievability = ref(0);

// Initialize retrievability from progress
(async () => {
  const progress = await learningProgressRepo.getByLearningItemId(props.cloze.id!);

  // Check if this is a new cloze
  isNewItem.value = !progress || !progress.cardData;

  // Load existing helper note if available
  if (progress?.helperNote) {
    existingHelperNote.value = progress.helperNote;
  }

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

async function saveHelperNote() {
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.cloze.id!, helperNote.value.trim());
    existingHelperNote.value = helperNote.value.trim();
    editingNote.value = false;
  }
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

  // Save helper note if provided
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.cloze.id!, helperNote.value.trim());
  }

  emit('complete');
}
</script>
