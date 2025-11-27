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
        <div
          v-if="highRecallItems.size > 0"
          class="mb-4 p-3 bg-base-200 rounded"
        >
          <div class="text-sm opacity-70 mb-2">
            Items you know well ({{ highRecallItems.size }}):
          </div>
          <ul class="list-disc list-inside space-y-1">
            <li
              v-for="idx in Array.from(highRecallItems)"
              :key="idx"
              class="text-sm opacity-70"
            >
              <MarkdownText :text="list.items[idx] || ''" />
            </li>
          </ul>
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">
              Try to remember the {{ list.items.length - highRecallItems.size }} remaining items:
            </span>
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
          v-if="isNewItem"
          class="btn btn-primary"
          @click="handleRememberCommitment"
        >
          I will try to remember
        </button>
        <button
          v-else
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
import { Edit } from 'lucide-vue-next';

import type { List } from './List';
import type { ElementModelsMap } from '@/entities/learning-progress/LearningProgress';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import PracticeLayout from '@/pages/practice/PracticeLayout.vue';

function normalizeItemKey(item: string): string {
  return item.trim().toLowerCase();
}

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
const itemRecallProbabilities = ref<number[]>([]);
const highRecallItems = ref<Set<number>>(new Set());

onMounted(async () => {
  // Check if this is a new list
  const progress = await learningProgressRepo.getByLearningItemId(props.list.id!);
  isNewItem.value = !progress;

  // Load existing helper note if available
  if (progress?.helperNote) {
    existingHelperNote.value = progress.helperNote;
  }

  // Calculate recall probabilities for each item
  const now = new Date();
  itemRecallProbabilities.value = props.list.items.map(item => {
    const key = normalizeItemKey(item);
    const elementData = progress?.listData?.elementModels?.[key];

    if (!elementData) return 0.0; // New item

    const elapsedHours = (now.getTime() - elementData.lastReviewTimestamp.getTime()) / (1000 * 60 * 60);
    return ebisu.predictRecall(elementData.model, elapsedHours, true);
  });

  // Identify high-recall items (>0.9)
  itemRecallProbabilities.value.forEach((recall, idx) => {
    if (recall > 0.9) {
      highRecallItems.value.add(idx);
    }
  });

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

  // Initialize remembered items array with pre-selected literal matches or high-recall items
  rememberedItems.value = props.list.items.map((correctItem, idx) => {
    const userAnswered = userAnswers.value.some(
      (userItem) => userItem.trim().toLowerCase() === correctItem.trim().toLowerCase()
    );
    const highRecall = highRecallItems.value.has(idx);

    return userAnswered || highRecall; // Pre-check if either condition met
  });

  revealed.value = true;
}

async function saveHelperNote() {
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.list.id!, helperNote.value.trim());
    existingHelperNote.value = helperNote.value.trim();
    editingNote.value = false;
  }
}

async function handleRememberCommitment() {
  const now = new Date();

  // Initialize element models for all items in the list
  const elementModels: ElementModelsMap = {};
  props.list.items.forEach((item) => {
    const key = normalizeItemKey(item);
    elementModels[key] = {
      model: ebisu.defaultModel(24),
      lastReviewTimestamp: now,
      addedAt: now
    };
  });

  // Initialize list-level model
  const listModel = ebisu.defaultModel(24);

  await learningProgressRepo.createIntroductionProgress(
    props.list.id!,
    'list',
    { listModel, elementModels }
  );

  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.list.id!, helperNote.value.trim());
  }

  emit('complete');
}

async function handleComplete() {
  const progress = await learningProgressRepo.getByLearningItemId(props.list.id!);
  const now = new Date();

  // 1. Update each element independently
  const elementModels: ElementModelsMap = {};

  props.list.items.forEach((item, idx) => {
    const key = normalizeItemKey(item);
    const wasRemembered = rememberedItems.value[idx];
    const elementData = progress?.listData?.elementModels?.[key];

    // Get current model or create default for new items
    const currentModel = elementData?.model || ebisu.defaultModel(24);
    const lastReview = elementData?.lastReviewTimestamp
      ? new Date(elementData.lastReviewTimestamp)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24hrs ago

    const elapsedHours = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60);

    // Binary update: 1 if remembered, 0 if forgotten
    const updatedModel = ebisu.updateRecall(
      currentModel,
      wasRemembered ? 1 : 0,
      1,
      elapsedHours
    );

    elementModels[key] = {
      model: updatedModel,
      lastReviewTimestamp: now,
      addedAt: elementData?.addedAt || now
    };
  });

  // 2. Update list-level model (for scheduling)
  const percentageCorrect = isNewItem.value
    ? 1.0
    : rememberedItems.value.filter(x => x).length / props.list.items.length;

  const listModel = progress?.listData?.model || ebisu.defaultModel(24);
  const listElapsedHours = progress?.listData
    ? (now.getTime() - new Date(progress.listData.lastReviewTimestamp).getTime()) / (1000 * 60 * 60)
    : 24;

  const updatedListModel = ebisu.updateRecall(
    listModel,
    percentageCorrect,
    1,
    listElapsedHours
  );

  // 3. Save both models
  if (progress) {
    await learningProgressRepo.updateEbisuProgressWithElements(
      props.list.id!,
      updatedListModel,
      elementModels
    );
  } else {
    await learningProgressRepo.createEbisuProgressWithElements(
      props.list.id!,
      'list',
      updatedListModel,
      elementModels
    );
  }

  // Save helper note if provided
  if (helperNote.value.trim()) {
    await learningProgressRepo.updateHelperNote(props.list.id!, helperNote.value.trim());
  }

  emit('complete');
}
</script>
