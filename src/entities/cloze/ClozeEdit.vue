<template>
  <div class="space-y-4">
    <!-- Pre/Post Exercise -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="form-control w-full">
        <label
          for="preExercise"
          class="label"
        >
          <span class="label-text">Pre-exercise (optional)</span>
        </label>
        <textarea
          id="preExercise"
          v-model="localPreExercise"
          placeholder="Text shown before the exercise (markdown supported)"
          class="textarea textarea-bordered w-full h-24"
        />
      </div>

      <div class="form-control w-full">
        <label
          for="postExercise"
          class="label"
        >
          <span class="label-text">Post-exercise (optional)</span>
        </label>
        <textarea
          id="postExercise"
          v-model="localPostExercise"
          placeholder="Text shown after revealing (markdown supported)"
          class="textarea textarea-bordered w-full h-24"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="form-control w-full">
      <label
        for="content"
        class="label"
      >
        <span class="label-text">Content</span>
      </label>
      <textarea
        id="content"
        v-model="localContent"
        placeholder="The main text to be clozed"
        class="textarea textarea-bordered w-full h-32"
      />
    </div>

    <!-- Strategy Selector -->
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Cloze Strategy</span>
      </label>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-sm"
          :class="{ 'btn-active': localClozeStrategy === 'atSpace' }"
          @click="changeClozeStrategy('atSpace')"
        >
          At Space
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="{ 'btn-active': localClozeStrategy === 'atEveryCharacter' }"
          @click="changeClozeStrategy('atEveryCharacter')"
        >
          Every Character
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="{ 'btn-active': localClozeStrategy === 'split' }"
          @click="changeClozeStrategy('split')"
        >
          Split
        </button>
      </div>
    </div>

    <!-- Interactive Cloze Selection UI -->
    <div
      v-if="localContent"
      class="form-control w-full"
    >
      <label class="label">
        <span class="label-text">Select clozeable parts</span>
      </label>

      <!-- atSpace Strategy -->
      <div
        v-if="localClozeStrategy === 'atSpace'"
        class="p-4 bg-base-200 rounded-lg text-lg leading-relaxed"
      >
        <template
          v-for="(part, index) in contentParts"
          :key="index"
        >
          <span
            v-if="part.type === 'word'"
            class="cursor-pointer px-1 rounded hover:bg-base-300 transition-colors"
            :class="{ 'bg-primary text-primary-content': isWordSelected(part.index!) }"
            @click="toggleWordIndex(part.index!)"
          >{{ part.text }}</span>
          <span v-else>{{ part.text }}</span>
        </template>
      </div>

      <!-- atEveryCharacter Strategy -->
      <div
        v-if="localClozeStrategy === 'atEveryCharacter'"
        class="p-4 bg-base-200 rounded-lg text-lg leading-relaxed font-mono"
      >
        <span
          v-for="(char, index) in localContent"
          :key="index"
          class="cursor-pointer hover:bg-base-300 transition-colors"
          :class="{
            'bg-primary text-primary-content': isCharSelected(index),
            'opacity-50': char === ' ' || char === '\t'
          }"
          @click="toggleCharIndex(index)"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </div>

      <!-- split Strategy -->
      <div
        v-if="localClozeStrategy === 'split'"
        class="p-4 bg-base-200 rounded-lg text-lg leading-relaxed font-mono"
      >
        <span
          v-for="(char, index) in localContent"
          :key="index"
          class="inline-block relative"
        >
          <!-- Clickable gap before character -->
          <span
            v-if="index > 0"
            class="absolute left-0 top-0 bottom-0 w-0.5 cursor-pointer hover:bg-info transition-colors z-10"
            :class="{ 'bg-error': isSplitMarkerAt(index) }"
            :style="{ transform: 'translateX(-50%)' }"
            @click="toggleSplitMarker(index)"
          >
            <span
              v-if="isSplitMarkerAt(index)"
              class="absolute -top-2 left-1/2 -translate-x-1/2 text-error"
            >▼</span>
          </span>
          {{ char === ' ' ? '\u00A0' : char }}
        </span>
      </div>
    </div>

    <!-- Preview -->
    <div
      v-if="localContent && localIndices.length > 0"
      class="form-control w-full"
    >
      <label class="label">
        <span class="label-text">Preview Examples</span>
      </label>
      <div class="space-y-2">
        <div
          v-for="(example, index) in previewExamples"
          :key="index"
          class="card card-xs bg-base-200 p-3"
        >
          <div class="text-sm">
            {{ example }}
          </div>
        </div>
      </div>
    </div>

    <!-- Priority -->
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
import { ref, watch, computed, onMounted } from 'vue';

import type { Cloze, ClozeStrategy } from '@/app/database';
import { generateClozeText, getDefaultIndices } from '@/dumb/cloze-utils';
import { learningProgressRepo } from '@/entities/learning-progress';

const props = defineProps<{
  cloze?: Cloze;
}>();

const emit = defineEmits<{
  update: [data: {
    preExercise?: string;
    postExercise?: string;
    content: string;
    clozeStrategy: ClozeStrategy;
    indices: number[];
    priority: number;
  }];
}>();

const localPreExercise = ref(props.cloze?.preExercise || '');
const localPostExercise = ref(props.cloze?.postExercise || '');
const localContent = ref(props.cloze?.content || '');
const localClozeStrategy = ref<ClozeStrategy>(props.cloze?.clozeStrategy || 'atSpace');
const localIndices = ref<number[]>(props.cloze?.indices || []);
const localPriority = ref(5);

onMounted(async () => {
  // Load priority from learning progress if cloze exists
  if (props.cloze?.id) {
    localPriority.value = await learningProgressRepo.getPriority(props.cloze.id);
  }
});

// Parse content into parts for atSpace display
interface ContentPart {
  type: 'word' | 'space';
  text: string;
  index?: number; // word index
}

const contentParts = computed((): ContentPart[] => {
  const parts: ContentPart[] = [];
  const splitParts = localContent.value.split(/(\s+)/);
  let wordIndex = 0;

  for (const part of splitParts) {
    if (part.trim() !== '') {
      parts.push({ type: 'word', text: part, index: wordIndex });
      wordIndex++;
    } else if (part.length > 0) {
      parts.push({ type: 'space', text: part });
    }
  }

  return parts;
});

// Selection helpers
function isWordSelected(wordIndex: number): boolean {
  return localIndices.value.includes(wordIndex);
}

function isCharSelected(charIndex: number): boolean {
  return localIndices.value.includes(charIndex);
}

function isSplitMarkerAt(position: number): boolean {
  return localIndices.value.includes(position - 1);
}

function toggleWordIndex(wordIndex: number): void {
  const index = localIndices.value.indexOf(wordIndex);
  if (index >= 0) {
    localIndices.value.splice(index, 1);
  } else {
    localIndices.value.push(wordIndex);
  }
  emitUpdate();
}

function toggleCharIndex(charIndex: number): void {
  const char = localContent.value[charIndex];
  if (char === ' ' || char === '\t') return; // Don't allow selecting spaces/tabs

  const index = localIndices.value.indexOf(charIndex);
  if (index >= 0) {
    localIndices.value.splice(index, 1);
  } else {
    localIndices.value.push(charIndex);
  }
  emitUpdate();
}

function toggleSplitMarker(position: number): void {
  const markerIndex = position - 1; // Store the index of the character before the gap
  const index = localIndices.value.indexOf(markerIndex);

  if (index >= 0) {
    localIndices.value.splice(index, 1);
  } else {
    localIndices.value.push(markerIndex);
  }
  emitUpdate();
}

function changeClozeStrategy(strategy: ClozeStrategy): void {
  localClozeStrategy.value = strategy;
  // Reset indices with defaults for new strategy
  localIndices.value = getDefaultIndices(localContent.value, strategy);
  emitUpdate();
}

// Generate preview examples
const previewExamples = computed(() => {
  if (!localContent.value || localIndices.value.length === 0) return [];

  const examples: string[] = [];
  const maxExamples = 3;

  for (let i = 0; i < maxExamples; i++) {
    const { clozedText } = generateClozeText(
      localContent.value,
      localIndices.value,
      localClozeStrategy.value,
      i * 0.4 // Vary difficulty
    );
    examples.push(clozedText);
  }

  return examples;
});

function emitUpdate(): void {
  emit('update', {
    preExercise: localPreExercise.value || undefined,
    postExercise: localPostExercise.value || undefined,
    content: localContent.value,
    clozeStrategy: localClozeStrategy.value,
    indices: localIndices.value,
    priority: localPriority.value,
  });
}

// Watch for content changes to reset indices
watch(localContent, (newContent) => {
  if (newContent && localIndices.value.length === 0) {
    localIndices.value = getDefaultIndices(newContent, localClozeStrategy.value);
  }
  emitUpdate();
});

watch([localPreExercise, localPostExercise, localPriority], () => {
  emitUpdate();
});

// Initialize indices if content exists but indices are empty
if (localContent.value && localIndices.value.length === 0) {
  localIndices.value = getDefaultIndices(localContent.value, localClozeStrategy.value);
}
</script>

<style scoped>
/* Ensure split markers are visible */
.relative {
  position: relative;
}
</style>
