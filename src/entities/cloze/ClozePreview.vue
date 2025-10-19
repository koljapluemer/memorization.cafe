<template>
  <div class="space-y-4">
    <MarkdownText
      v-if="cloze.preExercise"
      :text="cloze.preExercise"
    />

    <div
      v-for="(example, index) in examples"
      :key="index"
      class="card card-compact bg-base-200 p-3"
    >
      <div class="text-sm">
        {{ example }}
      </div>
    </div>

    <MarkdownText
      v-if="cloze.postExercise"
      :text="cloze.postExercise"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { Cloze } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { generateClozeText } from '@/dumb/cloze-utils';

const props = defineProps<{
  cloze: Cloze;
}>();

// Generate 3 random examples with varying difficulty
const examples = computed(() => {
  const result: string[] = [];
  const maxExamples = Math.min(3, props.cloze.indices.length > 0 ? 3 : 1);

  for (let i = 0; i < maxExamples; i++) {
    const { clozedText } = generateClozeText(
      props.cloze.content,
      props.cloze.indices,
      props.cloze.clozeStrategy,
      i * 0.3 // Vary retrievability: 0, 0.3, 0.6
    );
    result.push(clozedText);
  }

  return result;
});
</script>
