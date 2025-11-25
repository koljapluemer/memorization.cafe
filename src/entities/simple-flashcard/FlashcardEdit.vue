<template>
  <div class="space-y-4">
    <fieldset class="fieldset">
      <label
        for="front"
        class="label"
      >
        Front
      </label>
      <textarea
        id="front"
        v-model="localFront"
        placeholder="Front of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </fieldset>

    <fieldset class="fieldset">
      <label class="label">Front Image (optional)</label>
      <input
        ref="frontImageInputRef"
        type="file"
        accept="image/*"
        class="file-input file-input-bordered w-full"
        @change="handleFrontImageSelect"
      >
      <div
        v-if="localFrontImage"
        class="mt-2"
      >
        <img
          :src="localFrontImage"
          class="max-w-sm rounded"
        >
        <button
          type="button"
          class="btn btn-sm btn-ghost mt-1"
          @click="removeFrontImage"
        >
          Remove Image
        </button>
      </div>
    </fieldset>

    <fieldset
      v-if="localFrontImage"
      class="fieldset"
    >
      <label
        for="front-image-label"
        class="label"
      >
        Front Image Label (optional)
      </label>
      <input
        id="front-image-label"
        v-model="localFrontImageLabel"
        type="text"
        class="input"
        placeholder="Caption (markdown supported)"
      >
    </fieldset>

    <fieldset class="fieldset">
      <label
        for="back"
        class="label"
      >
        Back
      </label>
      <textarea
        id="back"
        v-model="localBack"
        placeholder="Back of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </fieldset>

    <fieldset class="fieldset">
      <label class="label">Back Image (optional)</label>
      <input
        ref="backImageInputRef"
        type="file"
        accept="image/*"
        class="file-input file-input-bordered w-full"
        @change="handleBackImageSelect"
      >
      <div
        v-if="localBackImage"
        class="mt-2"
      >
        <img
          :src="localBackImage"
          class="max-w-sm rounded"
        >
        <button
          type="button"
          class="btn btn-sm btn-ghost mt-1"
          @click="removeBackImage"
        >
          Remove Image
        </button>
      </div>
    </fieldset>

    <fieldset
      v-if="localBackImage"
      class="fieldset"
    >
      <label
        for="back-image-label"
        class="label"
      >
        Back Image Label (optional)
      </label>
      <input
        id="back-image-label"
        v-model="localBackImageLabel"
        type="text"
        class="input"
        placeholder="Caption (markdown supported)"
      >
    </fieldset>

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

    <MinimumIntervalSelector v-model="localMinimumInterval" />

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

import type { SimpleFlashcard, Duration } from '@/app/database';
import { MinimumIntervalSelector } from '@/features/minimum-interval-selector';
import { resizeImage } from '@/dumb/image-utils';

const props = defineProps<{
  flashcard?: SimpleFlashcard;
}>();

const emit = defineEmits<{
  update: [data: { front: string; back: string; practiceAsFlashcard: boolean; practiceAsPrompt: boolean; practiceReverse: boolean; isDisabled: boolean; minimumInterval?: Duration; priority: number; frontImage?: string; frontImageLabel?: string; backImage?: string; backImageLabel?: string }];
}>();

const localFront = ref(props.flashcard?.front || '');
const localBack = ref(props.flashcard?.back || '');
const localPracticeAsFlashcard = ref(props.flashcard?.practiceAsFlashcard ?? true);
const localPracticeAsPrompt = ref(props.flashcard?.practiceAsPrompt ?? false);
const localPracticeReverse = ref(props.flashcard?.practiceReverse ?? false);
const localIsDisabled = ref(props.flashcard?.isDisabled ?? false);
const localMinimumInterval = ref<Duration | undefined>(props.flashcard?.minimumInterval);
const localPriority = ref(5);
const localFrontImage = ref<string | undefined>(props.flashcard?.frontImage);
const localFrontImageLabel = ref<string | undefined>(props.flashcard?.frontImageLabel);
const localBackImage = ref<string | undefined>(props.flashcard?.backImage);
const localBackImageLabel = ref<string | undefined>(props.flashcard?.backImageLabel);

const frontImageInputRef = ref<HTMLInputElement | null>(null);
const backImageInputRef = ref<HTMLInputElement | null>(null);

const validationError = computed(() => {
  if (!localPracticeAsFlashcard.value && !localPracticeAsPrompt.value) {
    return 'At least one practice mode must be selected';
  }
  return '';
});

async function handleFrontImageSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    localFrontImage.value = await resizeImage(file);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to load image');
    if (frontImageInputRef.value) {
      frontImageInputRef.value.value = '';
    }
  }
}

function removeFrontImage() {
  localFrontImage.value = undefined;
  localFrontImageLabel.value = undefined;
  if (frontImageInputRef.value) {
    frontImageInputRef.value.value = '';
  }
}

async function handleBackImageSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    localBackImage.value = await resizeImage(file);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to load image');
    if (backImageInputRef.value) {
      backImageInputRef.value.value = '';
    }
  }
}

function removeBackImage() {
  localBackImage.value = undefined;
  localBackImageLabel.value = undefined;
  if (backImageInputRef.value) {
    backImageInputRef.value.value = '';
  }
}

onMounted(() => {
  // Load priority from entity
  if (props.flashcard?.priority !== undefined) {
    localPriority.value = props.flashcard.priority;
  }
});

watch([localFront, localBack, localPracticeAsFlashcard, localPracticeAsPrompt, localPracticeReverse, localIsDisabled, localMinimumInterval, localPriority, localFrontImage, localFrontImageLabel, localBackImage, localBackImageLabel], () => {
  emit('update', {
    front: localFront.value,
    back: localBack.value,
    practiceAsFlashcard: localPracticeAsFlashcard.value,
    practiceAsPrompt: localPracticeAsPrompt.value,
    practiceReverse: localPracticeReverse.value,
    isDisabled: localIsDisabled.value,
    minimumInterval: localMinimumInterval.value,
    priority: localPriority.value,
    frontImage: localFrontImage.value,
    frontImageLabel: localFrontImageLabel.value,
    backImage: localBackImage.value,
    backImageLabel: localBackImageLabel.value,
  });
});
</script>
