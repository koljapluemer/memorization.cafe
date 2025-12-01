<template>
  <dialog
    ref="modalRef"
    class="modal"
  >
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        Learning Progress
      </h3>

      <div v-if="!progress">
        <div class="text-center py-8 text-base-content/70">
          <p class="text-lg">
            Not yet practiced
          </p>
          <p class="text-sm mt-2">
            This item has not been introduced in practice sessions yet.
          </p>
        </div>
      </div>

      <div v-else>
        <!-- Flashcard & Cloze Progress (FSRS) -->
        <div v-if="(itemType === 'flashcard' || itemType === 'cloze') && progress.cardData">
          <div class="space-y-4">
            <!-- Basic Stats -->
            <div>
              <h4 class="font-semibold mb-2">
                Basic Statistics
              </h4>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt class="text-base-content/70">
                    Current State
                  </dt>
                  <dd class="font-medium">
                    {{ getFSRSStateName(progress.cardData.state) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-base-content/70">
                    Total Reviews
                  </dt>
                  <dd class="font-medium">
                    {{ progress.cardData.reps }}
                  </dd>
                </div>
                <div>
                  <dt class="text-base-content/70">
                    Last Reviewed
                  </dt>
                  <dd class="font-medium">
                    {{ progress.cardData.last_review ? formatRelativeDate(progress.cardData.last_review) : 'Never' }}
                  </dd>
                  <dd
                    v-if="progress.cardData.last_review"
                    class="text-xs text-base-content/60"
                  >
                    {{ formatAbsoluteDate(progress.cardData.last_review) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-base-content/70">
                    Next Due
                  </dt>
                  <dd class="font-medium">
                    {{ formatRelativeDate(progress.cardData.due) }}
                  </dd>
                  <dd class="text-xs text-base-content/60">
                    {{ formatAbsoluteDate(progress.cardData.due) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="divider" />

            <!-- Algorithm Details -->
            <details class="collapse collapse-arrow bg-base-200">
              <summary class="collapse-title font-semibold">
                Algorithm Details (FSRS)
              </summary>
              <div class="collapse-content">
                <dl class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt class="text-base-content/70">
                      Difficulty
                    </dt>
                    <dd class="font-medium">
                      {{ formatNumber(progress.cardData.difficulty, 2) }} / 10
                    </dd>
                  </div>
                  <div>
                    <dt class="text-base-content/70">
                      Stability (days)
                    </dt>
                    <dd class="font-medium">
                      {{ formatNumber(progress.cardData.stability, 1) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-base-content/70">
                      Elapsed Days
                    </dt>
                    <dd class="font-medium">
                      {{ progress.cardData.elapsed_days }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-base-content/70">
                      Scheduled Days
                    </dt>
                    <dd class="font-medium">
                      {{ progress.cardData.scheduled_days }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-base-content/70">
                      Lapses
                    </dt>
                    <dd class="font-medium">
                      {{ progress.cardData.lapses }}
                    </dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>
        </div>

        <!-- List Progress (Ebisu) -->
        <div v-else-if="itemType === 'list' && progress.listData">
          <div class="space-y-4">
            <!-- Basic Stats -->
            <div>
              <h4 class="font-semibold mb-2">
                Basic Statistics
              </h4>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt class="text-base-content/70">
                    Last Reviewed
                  </dt>
                  <dd class="font-medium">
                    {{ formatRelativeDate(progress.listData.lastReviewTimestamp) }}
                  </dd>
                  <dd class="text-xs text-base-content/60">
                    {{ formatAbsoluteDate(progress.listData.lastReviewTimestamp) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-base-content/70">
                    Current Recall Probability
                  </dt>
                  <dd class="font-medium">
                    {{ formatPercentage(calculateRecallProbability(progress.listData.model, progress.listData.lastReviewTimestamp)) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="divider" />

            <!-- Algorithm Details -->
            <details class="collapse collapse-arrow bg-base-200">
              <summary class="collapse-title font-semibold">
                Algorithm Details (Ebisu)
              </summary>
              <div class="collapse-content">
                <dl class="space-y-2 text-sm">
                  <div>
                    <dt class="text-base-content/70">
                      Model Parameters [α, β, t]
                    </dt>
                    <dd class="font-mono text-xs">
                      [{{ formatNumber(progress.listData.model[0]) }}, {{ formatNumber(progress.listData.model[1]) }}, {{ formatNumber(progress.listData.model[2]) }}]
                    </dd>
                  </div>
                  <div v-if="progress.listData.elementModels && Object.keys(progress.listData.elementModels).length > 0">
                    <dt class="text-base-content/70 mb-2">
                      Per-Element Recall Probabilities
                    </dt>
                    <dd class="space-y-1">
                      <div
                        v-for="(elementData, key) in progress.listData.elementModels"
                        :key="key"
                        class="flex justify-between text-xs"
                      >
                        <span class="truncate mr-2">{{ key }}</span>
                        <span class="font-medium">{{ formatPercentage(calculateRecallProbability(elementData.model, elementData.lastReviewTimestamp)) }}</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>
        </div>

        <!-- Concept Progress (Elaborative Interrogation) -->
        <div v-else-if="itemType === 'concept' && progress.answers">
          <div class="space-y-4">
            <!-- Basic Stats -->
            <div>
              <h4 class="font-semibold mb-2">
                Basic Statistics
              </h4>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt class="text-base-content/70">
                    Total Q&A Sessions
                  </dt>
                  <dd class="font-medium">
                    {{ progress.answers.length }}
                  </dd>
                </div>
                <div v-if="lastAnswer">
                  <dt class="text-base-content/70">
                    Last Answered
                  </dt>
                  <dd class="font-medium">
                    {{ formatRelativeDate(lastAnswer.timestamp) }}
                  </dd>
                  <dd class="text-xs text-base-content/60">
                    {{ formatAbsoluteDate(lastAnswer.timestamp) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="divider" />

            <!-- Q&A History -->
            <div>
              <h4 class="font-semibold mb-2">
                Recent Q&A History
              </h4>
              <div
                v-if="progress.answers.length === 0"
                class="text-sm text-base-content/70"
              >
                No Q&A sessions yet.
              </div>
              <div
                v-else
                class="space-y-3"
              >
                <div
                  v-for="(qa, index) in progress.answers.slice(-10).reverse()"
                  :key="index"
                  class="bg-base-200 p-3 rounded-lg text-sm"
                >
                  <div class="font-semibold text-xs text-base-content/70 mb-1">
                    {{ formatAbsoluteDate(qa.timestamp) }}
                  </div>
                  <div class="mb-2">
                    <span class="font-medium">Q:</span> {{ qa.question }}
                  </div>
                  <div>
                    <span class="font-medium">A:</span> {{ qa.answer }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Introduction Timestamp -->
        <div
          v-if="progress.introductionTimestamp"
          class="mt-4"
        >
          <div class="text-xs text-base-content/60">
            First introduced: {{ formatAbsoluteDate(progress.introductionTimestamp) }}
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn"
          @click="close"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import {
  formatRelativeDate,
  formatAbsoluteDate,
  getFSRSStateName,
  calculateRecallProbability,
  formatPercentage,
  formatNumber,
} from './progress-formatting';

import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';
import type { LearningProgress } from '@/entities/learning-progress/LearningProgress';


const props = defineProps<{
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  item: SimpleFlashcard | Concept | List | Cloze;
  progress: LearningProgress | null;
}>();

const modalRef = ref<HTMLDialogElement | null>(null);

const lastAnswer = computed(() => {
  if (!props.progress?.answers || props.progress.answers.length === 0) {
    return null;
  }
  return props.progress.answers[props.progress.answers.length - 1] ?? null;
});

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

defineExpose({ open });
</script>
