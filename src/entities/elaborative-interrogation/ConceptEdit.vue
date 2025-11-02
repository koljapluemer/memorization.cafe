<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label
        for="name"
        class="label"
      >
        <span class="label-text">Name</span>
      </label>
      <input
        id="name"
        v-model="localName"
        type="text"
        placeholder="Concept name"
        class="input input-bordered w-full"
      >
    </div>

    <div class="form-control w-full">
      <label
        for="description"
        class="label"
      >
        <span class="label-text">Description (optional)</span>
      </label>
      <textarea
        id="description"
        v-model="localDescription"
        placeholder="Concept description (markdown supported)"
        class="textarea textarea-bordered w-full h-32"
      />
    </div>

    <div class="form-control w-full">
      <label
        for="questionList"
        class="label"
      >
        <span class="label-text">Question List</span>
      </label>
      <select
        id="questionList"
        v-model="localQuestionListId"
        class="select select-bordered w-full"
      >
        <option
          v-for="list in questionLists"
          :key="list.id"
          :value="list.id"
        >
          {{ list.name }}{{ list.isDefault ? ' (Default)' : '' }}
        </option>
      </select>
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
import { ref, watch, onMounted } from 'vue';

import type { ElaborativeInterrogationConcept } from '@/app/database';
import { questionListRepo } from '@/entities/question-list';
import type { QuestionList } from '@/entities/question-list';
import { learningProgressRepo } from '@/entities/learning-progress';

const props = defineProps<{
  concept?: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  update: [data: { name: string; description?: string; questionListId?: string; priority: number }];
}>();

const localName = ref(props.concept?.name || '');
const localDescription = ref(props.concept?.description || '');
const localQuestionListId = ref<string | undefined>(props.concept?.questionListId);
const localPriority = ref(5);
const questionLists = ref<QuestionList[]>([]);

onMounted(async () => {
  questionLists.value = await questionListRepo.getAll();

  // If creating new concept (no questionListId), preselect the default list
  if (!props.concept?.questionListId) {
    const defaultList = questionLists.value.find(list => list.isDefault);
    if (defaultList?.id) {
      localQuestionListId.value = defaultList.id;
    }
  }

  // Load priority from learning progress if concept exists
  if (props.concept?.id) {
    localPriority.value = await learningProgressRepo.getPriority(props.concept.id);
  }
});

watch([localName, localDescription, localQuestionListId, localPriority], () => {
  emit('update', {
    name: localName.value,
    description: localDescription.value || undefined,
    questionListId: localQuestionListId.value,
    priority: localPriority.value,
  });
});
</script>
