<template>
  <PracticeLayout
    @skip="emit('skip')"
    @edit="emit('edit')"
    @delete="emit('delete')"
    @filter="emit('filter')"
  >
    <template #exercise>
      <MarkdownText :text="list.name" />

      <template v-if="revealed">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <tbody>
              <tr
                v-for="(correctItem, index) in list.items"
                :key="index"
              >
                <td v-if="list.isOrderedList">
                  {{ index + 1 }}
                </td>
                <td v-if="!isNewItem">
                  <MarkdownText
                    v-if="userAnswers[index]"
                    :text="userAnswers[index]"
                  />
                </td>
                <td>
                  <template v-if="isNewItem">
                    <MarkdownText :text="correctItem" />
                  </template>
                  <label
                    v-else
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="rememberedItems[index]"
                      type="checkbox"
                      class="checkbox"
                    >
                    <MarkdownText :text="correctItem" />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="list.note"
          class="card bg-base-200 p-3 mt-4"
        >
          <div class="text-xs opacity-70 mb-1">
            Note
          </div>
          <MarkdownText :text="list.note" />
        </div>

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
    </template>

    <template #controls>
      <div
        v-if="!revealed"
        class="space-y-4"
      >
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Enter items you remember:</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(_userItem, index) in userInputItems"
              :key="index"
              class="flex gap-2 items-center"
            >
              <input
                v-model="userInputItems[index]"
                type="text"
                :placeholder="`Item ${index + 1}`"
                class="input input-bordered flex-1"
                @input="handleUserInputChange"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-center">
          <button
            class="btn"
            @click="handleReveal"
          >
            Reveal
          </button>
        </div>
      </div>

      <div
        v-if="revealed"
        class="flex justify-center"
      >
        <button
          class="btn btn-primary"
          @click="handleComplete"
        >
          Done
        </button>
      </div>
    </template>
  </PracticeLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as ebisu from 'ebisu-js';
import type { Model as EbisuModel } from 'ebisu-js';
import { Edit } from 'lucide-vue-next';

import type { List } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { learningProgressRepo } from '@/entities/learning-progress';
import PracticeLayout from '@/pages/practice/PracticeLayout.vue';

const props = defineProps<{
  list: List;
}>();

const emit = defineEmits<{
  complete: [];
  skip: [];
  edit: [];
  delete: [];
  filter: [];
}>();

const revealed = ref(false);
const userInputItems = ref<string[]>(['']);
const userAnswers = ref<string[]>([]);
const rememberedItems = ref<boolean[]>([]);
const helperNote = ref('');
const existingHelperNote = ref('');
const isNewItem = ref(false);
const editingNote = ref(false);

onMounted(async () => {
  // Check if this is a new list
  const progress = await learningProgressRepo.getByLearningItemId(props.list.id!);
  isNewItem.value = !progress;

  // Load existing helper note if available
  if (progress?.helperNote) {
    existingHelperNote.value = progress.helperNote;
  }

  // Auto-reveal for new items
  if (isNewItem.value) {
    revealed.value = true;
    // Show all correct items for new lists
    rememberedItems.value = props.list.items.map(() => false);
  }
});

function handleUserInputChange() {
  const nonEmptyItems = userInputItems.value.filter((item) => item.trim() !== '');
  userInputItems.value = [...nonEmptyItems, ''];
}

function handleReveal() {
  userAnswers.value = userInputItems.value.filter((item) => item.trim() !== '');

  // Initialize remembered items array with pre-selected literal matches
  rememberedItems.value = props.list.items.map((correctItem) =>
    userAnswers.value.some((userItem) => userItem.trim().toLowerCase() === correctItem.trim().toLowerCase())
  );

  revealed.value = true;
}

async function saveHelperNote() {
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.list.id!, helperNote.value.trim());
    existingHelperNote.value = helperNote.value.trim();
    editingNote.value = false;
  }
}

async function handleComplete() {
  const progress = await learningProgressRepo.getByLearningItemId(props.list.id!);

  // For new items, treat as 100% learned
  let percentageCorrect: number;
  if (isNewItem.value) {
    percentageCorrect = 1.0;
  } else {
    const correctCount = rememberedItems.value.filter((remembered) => remembered).length;
    const totalCount = props.list.items.length;
    percentageCorrect = totalCount > 0 ? correctCount / totalCount : 0;
  }

  let model: EbisuModel;
  let elapsedHours: number;

  if (progress && progress.listData) {
    model = progress.listData.model;
    const lastReviewTime = new Date(progress.listData.lastReviewTimestamp);
    elapsedHours = (new Date().getTime() - lastReviewTime.getTime()) / (1000 * 60 * 60);
  } else {
    model = ebisu.defaultModel(24);
    elapsedHours = 24;
  }

  const updatedModel = ebisu.updateRecall(model, percentageCorrect, 1, elapsedHours);

  if (progress) {
    await learningProgressRepo.updateEbisuProgress(props.list.id!, updatedModel);
  } else {
    await learningProgressRepo.createEbisuProgress(props.list.id!, 'list', updatedModel);
  }

  // Save helper note if provided
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.list.id!, helperNote.value.trim());
  }

  emit('complete');
}
</script>
