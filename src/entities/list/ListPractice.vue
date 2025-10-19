<template>
  <div class="space-y-4">
    <MarkdownText :text="list.name" />

    <template v-if="!revealed">
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
    </template>

    <template v-if="revealed">
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th v-if="list.isOrderedList">
                #
              </th>
              <th>Your Input</th>
              <th>Correct Items</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(correctItem, index) in list.items"
              :key="index"
            >
              <td v-if="list.isOrderedList">
                {{ index + 1 }}
              </td>
              <td>{{ userAnswers[index] || '' }}</td>
              <td>
                <label class="flex items-center gap-2">
                  <input
                    v-model="rememberedItems[index]"
                    type="checkbox"
                    class="checkbox"
                  >
                  {{ correctItem }}
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

      <div class="flex justify-center mt-4">
        <button
          class="btn btn-primary"
          @click="handleComplete"
        >
          Done
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as ebisu from 'ebisu-js';
import type { Model as EbisuModel } from 'ebisu-js';

import type { List } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';
import { learningProgressRepo } from '@/entities/learning-progress';

const props = defineProps<{
  list: List;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const revealed = ref(false);
const userInputItems = ref<string[]>(['']);
const userAnswers = ref<string[]>([]);
const rememberedItems = ref<boolean[]>([]);

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

async function handleComplete() {
  const progress = await learningProgressRepo.getByLearningItemId(props.list.id!);

  const correctCount = rememberedItems.value.filter((remembered) => remembered).length;
  const totalCount = props.list.items.length;
  const percentageCorrect = totalCount > 0 ? correctCount / totalCount : 0;

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

  emit('complete');
}
</script>
