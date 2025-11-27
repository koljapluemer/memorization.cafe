<template>
  <dialog
    ref="modal"
    class="modal"
  >
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        {{ list?.id ? 'Edit Question List' : 'New Question List' }}
      </h3>

      <div class="form-control w-full mb-4">
        <label
          for="listName"
          class="label"
        >
          <span class="label-text">List Name</span>
        </label>
        <input
          id="listName"
          v-model="localName"
          type="text"
          placeholder="e.g., Deep Understanding Questions"
          class="input input-bordered w-full"
        >
      </div>

      <div class="form-control w-full mb-4">
        <label class="label">
          <span class="label-text">Questions</span>
        </label>
        <div class="space-y-2">
          <div
            v-for="(_question, index) in localQuestions"
            :key="index"
            class="flex gap-2"
          >
            <input
              v-model="localQuestions[index]"
              type="text"
              placeholder="Enter a question"
              class="input input-bordered flex-1"
            >
            <button
              class="btn btn-square btn-error btn-outline"
              @click="removeQuestion(index)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>
        <button
          class="btn btn-sm btn-ghost mt-2"
          @click="addQuestion"
        >
          + Add Question
        </button>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          @click="close"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          @click="save"
        >
          Save
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button @click="close">
        close
      </button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import type { QuestionList } from '@/entities/question-list/QuestionList';
import { questionListRepo } from '@/entities/question-list/repo';
import { useToast } from '@/app/toast';

const props = defineProps<{
  list: QuestionList | null;
}>();

const emit = defineEmits<{
  save: [];
}>();

const modal = ref<HTMLDialogElement | null>(null);
const localName = ref('');
const localQuestions = ref<string[]>([]);
const toast = useToast();

watch(() => props.list, (newList) => {
  if (newList) {
    localName.value = newList.name;
    localQuestions.value = [...newList.questions];
  } else {
    localName.value = '';
    localQuestions.value = [''];
  }
});

function open() {
  if (props.list) {
    localName.value = props.list.name;
    localQuestions.value = [...props.list.questions];
  } else {
    localName.value = '';
    localQuestions.value = [''];
  }
  modal.value?.showModal();
}

function close() {
  modal.value?.close();
}

function addQuestion() {
  localQuestions.value.push('');
}

function removeQuestion(index: number) {
  localQuestions.value.splice(index, 1);
}

async function save() {
  if (!localName.value.trim()) {
    toast.show('Please enter a list name', 'error');
    return;
  }

  const filteredQuestions = localQuestions.value.filter(q => q.trim());
  if (filteredQuestions.length === 0) {
    toast.show('Please add at least one question', 'error');
    return;
  }

  try {
    if (props.list?.id) {
      // Update existing
      await questionListRepo.update(props.list.id, {
        name: localName.value,
        questions: filteredQuestions,
      });
      toast.show('Question list updated', 'success');
    } else {
      // Create new
      await questionListRepo.create({
        name: localName.value,
        questions: filteredQuestions,
        isDefault: false,
      });
      toast.show('Question list created', 'success');
    }

    emit('save');
    close();
  } catch (error) {
    toast.show(`Failed to save: ${error}`, 'error');
  }
}

defineExpose({
  open,
  close,
});
</script>
