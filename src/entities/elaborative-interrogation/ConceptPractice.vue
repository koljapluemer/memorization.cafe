<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">
      {{ concept.name }}
    </h2>

    <MarkdownText
      v-if="concept.description"
      :text="concept.description"
    />

    <div class="divider" />

    <p class="text-lg font-semibold">
      {{ selectedQuestion }}
    </p>

    <div class="form-control w-full">
      <textarea
        v-model="answer"
        placeholder="Type your answer here..."
        class="textarea textarea-bordered w-full h-40"
      />
    </div>

    <div class="flex justify-center">
      <button
        class="btn btn-primary"
        @click="handleDone"
      >
        Done
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import type { ElaborativeInterrogationConcept } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { getRandomItem } from '@/dumb/array-utils';
import { learningProgressRepo } from '@/entities/learning-progress';
import { questionListRepo } from '@/entities/question-list';


const props = defineProps<{
  concept: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const selectedQuestion = ref('');
const answer = ref('');

onMounted(async () => {
  // Load the appropriate question list
  let questionList;
  if (props.concept.questionListId) {
    questionList = await questionListRepo.getById(props.concept.questionListId);
  }

  // If no specific list or not found, use default
  if (!questionList) {
    questionList = await questionListRepo.getDefault();
  }

  // Select a random question from the list
  if (questionList.questions.length > 0) {
    const randomQuestion = getRandomItem([...questionList.questions]);
    selectedQuestion.value = randomQuestion || questionList.questions[0] || '';
  }
});

async function handleDone() {
  if (!answer.value.trim()) return;

  const progress = await learningProgressRepo.getByLearningItemId(props.concept.id!);

  if (progress) {
    await learningProgressRepo.addConceptAnswer(
      props.concept.id!,
      selectedQuestion.value,
      answer.value
    );
  } else {
    await learningProgressRepo.createConceptProgress(props.concept.id!);
    await learningProgressRepo.addConceptAnswer(
      props.concept.id!,
      selectedQuestion.value,
      answer.value
    );
  }

  emit('complete');
}
</script>
