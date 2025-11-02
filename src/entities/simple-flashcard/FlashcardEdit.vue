<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label
        for="front"
        class="label"
      >
        <span class="label-text">Front</span>
      </label>
      <textarea
        id="front"
        v-model="localFront"
        placeholder="Front of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </div>

    <div class="form-control w-full">
      <label
        for="back"
        class="label"
      >
        <span class="label-text">Back</span>
      </label>
      <textarea
        id="back"
        v-model="localBack"
        placeholder="Back of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </div>

    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Practice Modes</span>
      </label>
      <div class="space-y-2">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            v-model="localPracticeAsFlashcard"
            type="checkbox"
            class="checkbox"
          >
          <span class="label-text">Practice as flashcard (reveal answer)</span>
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input
            v-model="localPracticeAsPrompt"
            type="checkbox"
            class="checkbox"
          >
          <span class="label-text">Practice as prompt (type response)</span>
        </label>
        <label class="label cursor-pointer justify-start gap-2">
          <input
            v-model="localPracticeReverse"
            type="checkbox"
            class="checkbox"
          >
          <span class="label-text">Practice in reverse (randomly show back→front)</span>
        </label>
      </div>
      <label
        v-if="validationError"
        class="label"
      >
        <span class="label-text-alt text-error">{{ validationError }}</span>
      </label>
    </div>

    <div class="form-control w-full">
      <label class="label cursor-pointer justify-start gap-2">
        <input
          v-model="localIsDisabled"
          type="checkbox"
          class="checkbox checkbox-xs"
        >
        <span class="label-text">Disable this flashcard (won't appear in practice)</span>
      </label>
    </div>

    <div class="form-control w-full">
      <label
        for="priority"
        class="label"
      >
        <span class="label-text">Priority (1-10)</span>
        <span class="label-text-alt text-gray-500">Higher = appears more often</span>
      </label>
      <input
        id="priority"
        v-model.number="localPriority"
        type="range"
        min="1"
        max="10"
        class="range range-primary w-full"
        step="1"
      >
      <div class="flex w-full justify-between px-2 text-xs">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
        <span>7</span>
        <span>8</span>
        <span>9</span>
        <span>10</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';

import type { SimpleFlashcard } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress';

const props = defineProps<{
  flashcard?: SimpleFlashcard;
}>();

const emit = defineEmits<{
  update: [data: { front: string; back: string; practiceAsFlashcard: boolean; practiceAsPrompt: boolean; practiceReverse: boolean; isDisabled: boolean; priority: number }];
}>();

const localFront = ref(props.flashcard?.front || '');
const localBack = ref(props.flashcard?.back || '');
const localPracticeAsFlashcard = ref(props.flashcard?.practiceAsFlashcard ?? true);
const localPracticeAsPrompt = ref(props.flashcard?.practiceAsPrompt ?? false);
const localPracticeReverse = ref(props.flashcard?.practiceReverse ?? false);
const localIsDisabled = ref(props.flashcard?.isDisabled ?? false);
const localPriority = ref(5);

const validationError = computed(() => {
  if (!localPracticeAsFlashcard.value && !localPracticeAsPrompt.value) {
    return 'At least one practice mode must be selected';
  }
  return '';
});

onMounted(async () => {
  // Load priority from learning progress if flashcard exists
  if (props.flashcard?.id) {
    localPriority.value = await learningProgressRepo.getPriority(props.flashcard.id);
  }
});

watch([localFront, localBack, localPracticeAsFlashcard, localPracticeAsPrompt, localPracticeReverse, localIsDisabled, localPriority], () => {
  emit('update', {
    front: localFront.value,
    back: localBack.value,
    practiceAsFlashcard: localPracticeAsFlashcard.value,
    practiceAsPrompt: localPracticeAsPrompt.value,
    practiceReverse: localPracticeReverse.value,
    isDisabled: localIsDisabled.value,
    priority: localPriority.value,
  });
});
</script>
