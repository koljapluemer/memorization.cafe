<template>
  <PracticeLayout
    @skip="emit('skip')"
    @edit="emit('edit')"
    @delete="emit('delete')"
    @filter="emit('filter')"
  >
    <template #exercise>
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

    <template #controls>
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
    </template>
  </PracticeLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Edit } from 'lucide-vue-next';

import type { ElaborativeInterrogationConcept } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { getRandomItem } from '@/dumb/array-utils';
import { learningProgressRepo } from '@/entities/learning-progress';
import { questionListRepo } from '@/entities/question-list';
import PracticeLayout from '@/pages/practice/PracticeLayout.vue';

const props = defineProps<{
  concept: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  complete: [];
  skip: [];
  edit: [];
  delete: [];
  filter: [];
}>();

const selectedQuestion = ref('');
const answer = ref('');
const helperNote = ref('');
const existingHelperNote = ref('');
const isNewItem = ref(false);
const editingNote = ref(false);

onMounted(async () => {
  // Check if this is a new concept
  const progress = await learningProgressRepo.getByLearningItemId(props.concept.id!);
  isNewItem.value = !progress;

  // Load existing helper note if available
  if (progress?.helperNote) {
    existingHelperNote.value = progress.helperNote;
  }

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

async function saveHelperNote() {
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.concept.id!, helperNote.value.trim());
    existingHelperNote.value = helperNote.value.trim();
    editingNote.value = false;
  }
}

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

  // Save helper note if provided
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.concept.id!, helperNote.value.trim());
  }

  emit('complete');
}
</script>
