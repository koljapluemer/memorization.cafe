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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import type { SimpleFlashcard } from '@/app/database';

const props = defineProps<{
  flashcard?: SimpleFlashcard;
}>();

const emit = defineEmits<{
  update: [data: { front: string; back: string }];
}>();

const localFront = ref(props.flashcard?.front || '');
const localBack = ref(props.flashcard?.back || '');

watch([localFront, localBack], () => {
  emit('update', {
    front: localFront.value,
    back: localBack.value,
  });
});
</script>
