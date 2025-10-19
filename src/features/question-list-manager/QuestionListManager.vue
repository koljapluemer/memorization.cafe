<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">
      Question Lists
    </h2>

    <div class="space-y-2">
      <QuestionListRow
        v-for="list in questionLists"
        :key="list.id"
        :list="list"
        @edit="editQuestionList"
        @delete="deleteQuestionList"
        @set-default="setAsDefault"
      />
    </div>

    <button
      class="btn btn-primary btn-sm"
      @click="createNewQuestionList"
    >
      Add New List
    </button>

    <QuestionListEditModal
      ref="editModal"
      :list="editingList"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import QuestionListRow from './QuestionListRow.vue';
import QuestionListEditModal from './QuestionListEditModal.vue';

import { questionListRepo, type QuestionList } from '@/entities/question-list';
import { useToast } from '@/app/toast';

const questionLists = ref<QuestionList[]>([]);
const editingList = ref<QuestionList | null>(null);
const editModal = ref<InstanceType<typeof QuestionListEditModal> | null>(null);
const toast = useToast();

onMounted(async () => {
  await loadQuestionLists();
});

async function loadQuestionLists() {
  // Ensure default exists before loading all lists
  await questionListRepo.getDefault();
  questionLists.value = await questionListRepo.getAll();
}

function createNewQuestionList() {
  editingList.value = null;
  editModal.value?.open();
}

function editQuestionList(list: QuestionList) {
  editingList.value = list;
  editModal.value?.open();
}

async function deleteQuestionList(id: string) {
  try {
    await questionListRepo.delete(id);
    await loadQuestionLists();
    toast.show('Question list deleted', 'success');
  } catch (error) {
    toast.show(`Failed to delete: ${error}`, 'error');
  }
}

async function setAsDefault(id: string) {
  try {
    await questionListRepo.setAsDefault(id);
    await loadQuestionLists();
    toast.show('Default list updated', 'success');
  } catch (error) {
    toast.show(`Failed to set default: ${error}`, 'error');
  }
}

async function handleSave() {
  await loadQuestionLists();
}
</script>
