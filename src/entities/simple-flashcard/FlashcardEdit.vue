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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

import type { SimpleFlashcard } from '@/app/database';

const props = defineProps<{
  flashcard?: SimpleFlashcard;
}>();

const emit = defineEmits<{
  update: [data: { front: string; back: string; practiceAsFlashcard: boolean; practiceAsPrompt: boolean; isDisabled: boolean }];
}>();

const localFront = ref(props.flashcard?.front || '');
const localBack = ref(props.flashcard?.back || '');
const localPracticeAsFlashcard = ref(props.flashcard?.practiceAsFlashcard ?? true);
const localPracticeAsPrompt = ref(props.flashcard?.practiceAsPrompt ?? false);
const localIsDisabled = ref(props.flashcard?.isDisabled ?? false);

const validationError = computed(() => {
  if (!localPracticeAsFlashcard.value && !localPracticeAsPrompt.value) {
    return 'At least one practice mode must be selected';
  }
  return '';
});

watch([localFront, localBack, localPracticeAsFlashcard, localPracticeAsPrompt, localIsDisabled], () => {
  emit('update', {
    front: localFront.value,
    back: localBack.value,
    practiceAsFlashcard: localPracticeAsFlashcard.value,
    practiceAsPrompt: localPracticeAsPrompt.value,
    isDisabled: localIsDisabled.value,
  });
});
</script>
