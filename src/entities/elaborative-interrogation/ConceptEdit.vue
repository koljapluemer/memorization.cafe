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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

import type { ElaborativeInterrogationConcept } from '@/app/database';
import { questionListRepo } from '@/entities/question-list';
import type { QuestionList } from '@/entities/question-list';

const props = defineProps<{
  concept?: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  update: [data: { name: string; description?: string; questionListId?: string }];
}>();

const localName = ref(props.concept?.name || '');
const localDescription = ref(props.concept?.description || '');
const localQuestionListId = ref<string | undefined>(props.concept?.questionListId);
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
});

watch([localName, localDescription, localQuestionListId], () => {
  emit('update', {
    name: localName.value,
    description: localDescription.value || undefined,
    questionListId: localQuestionListId.value,
  });
});
</script>
