# Step 6: Elaborative Interrogation Concept Entity Implementation

## Overview
Implement the Elaborative Interrogation Concept learning item with all required components: repo, contract, Row.vue, Edit.vue, Practice.vue, and Preview.vue.

## Architecture Rules
- Entity folder: `src/entities/elaborative-interrogation/`
- May NOT import other entity folders (reference by string ID only)
- Can import from `dumb/` folder for utilities

## Tasks

### 6.1 Create Questions Constant

Create `src/entities/elaborative-interrogation/questions.ts`:

```typescript
export const ELABORATIVE_QUESTIONS = [
  'When does this concept apply?',
  'When does this concept not apply?',
  'What problem does this concept solve?',
  'Explain this concept to a five year old',
] as const;
```

### 6.2 Create Contract

Create `src/entities/elaborative-interrogation/contract.ts`:

```typescript
import type { ElaborativeInterrogationConcept } from '@/app/database';

export interface ElaborativeInterrogationContract {
  getAll(): Promise<ElaborativeInterrogationConcept[]>;
  getByCollectionId(collectionId: string): Promise<ElaborativeInterrogationConcept[]>;
  getById(id: string): Promise<ElaborativeInterrogationConcept | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<ElaborativeInterrogationConcept | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<ElaborativeInterrogationConcept | null>;

  create(data: Omit<ElaborativeInterrogationConcept, 'id'>): Promise<string>;
  update(id: string, data: Partial<ElaborativeInterrogationConcept>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 6.3 Create Repository

Create `src/entities/elaborative-interrogation/repo.ts`:

```typescript
import { db, type ElaborativeInterrogationConcept } from '@/app/database';
import type { ElaborativeInterrogationContract } from './contract';
import { learningProgressRepo } from '@/entities/learning-progress';
import { getRandomItem } from '@/dumb/array-utils';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const elaborativeInterrogationRepo: ElaborativeInterrogationContract = {
  async getAll(): Promise<ElaborativeInterrogationConcept[]> {
    return await db.concepts.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<ElaborativeInterrogationConcept[]> {
    return await db.concepts.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<ElaborativeInterrogationConcept | undefined> {
    return await db.concepts.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<ElaborativeInterrogationConcept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allConcepts.length === 0) return null;

    const conceptIds = allConcepts.map(c => c.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(conceptIds);

    const dueConcepts = allConcepts.filter(concept => {
      const progress = progressRecords.find(p => p.learningItemId === concept.id);
      if (!progress) return false;

      const lastAnswerTime = progress.answers?.[progress.answers.length - 1]?.timestamp;
      if (!lastAnswerTime) return false;

      const timeSinceLastAnswer = now.getTime() - new Date(lastAnswerTime).getTime();
      return timeSinceLastAnswer >= ONE_HOUR_MS;
    });

    return getRandomItem(dueConcepts);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<ElaborativeInterrogationConcept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newConcepts = allConcepts.filter(c => !existingProgressIds.includes(c.id!));
    return getRandomItem(newConcepts);
  },

  async create(data: Omit<ElaborativeInterrogationConcept, 'id'>): Promise<string> {
    const id = await db.concepts.add(data as ElaborativeInterrogationConcept);
    return id;
  },

  async update(id: string, data: Partial<ElaborativeInterrogationConcept>): Promise<void> {
    await db.concepts.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.concepts.delete(id);
    // Also delete associated progress
    await learningProgressRepo.delete(id);
  },
};
```

### 6.4 Create Row Component

Create `src/entities/elaborative-interrogation/Row.vue`:

```vue
<template>
  <span>
    <strong>{{ concept.name }}</strong>
    <template v-if="concept.description">
      {{ ' - ' + truncatedDescription }}
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ElaborativeInterrogationConcept } from '@/app/database';

const props = defineProps<{
  concept: ElaborativeInterrogationConcept;
}>();

function truncate(text: string, maxLength: number = 40): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const truncatedDescription = computed(() =>
  props.concept.description ? truncate(props.concept.description) : ''
);
</script>
```

### 6.5 Create Edit Component

Create `src/entities/elaborative-interrogation/Edit.vue`:

```vue
<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label for="name" class="label">
        <span class="label-text">Name</span>
      </label>
      <input
        id="name"
        v-model="localName"
        type="text"
        placeholder="Concept name"
        class="input input-bordered w-full"
      />
    </div>

    <div class="form-control w-full">
      <label for="description" class="label">
        <span class="label-text">Description (optional)</span>
      </label>
      <textarea
        id="description"
        v-model="localDescription"
        placeholder="Concept description (markdown supported)"
        class="textarea textarea-bordered w-full h-32"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ElaborativeInterrogationConcept } from '@/app/database';

const props = defineProps<{
  concept?: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  update: [data: { name: string; description?: string }];
}>();

const localName = ref(props.concept?.name || '');
const localDescription = ref(props.concept?.description || '');

watch([localName, localDescription], () => {
  emit('update', {
    name: localName.value,
    description: localDescription.value || undefined,
  });
});
</script>
```

### 6.6 Create Practice Component

Create `src/entities/elaborative-interrogation/Practice.vue`:

```vue
<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">{{ concept.name }}</h2>

    <MarkdownText v-if="concept.description" :text="concept.description" />

    <div class="divider"></div>

    <p class="text-lg font-semibold">{{ selectedQuestion }}</p>

    <div class="form-control w-full">
      <textarea
        v-model="answer"
        placeholder="Type your answer here..."
        class="textarea textarea-bordered w-full h-40"
      />
    </div>

    <div class="flex justify-center">
      <button @click="handleDone" class="btn btn-primary">Done</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ElaborativeInterrogationConcept } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress';
import { getRandomItem } from '@/dumb/array-utils';
import { ELABORATIVE_QUESTIONS } from './questions';
import MarkdownText from '@/dumb/MarkdownText.vue';

const props = defineProps<{
  concept: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const selectedQuestion = ref('');
const answer = ref('');

onMounted(() => {
  selectedQuestion.value = getRandomItem(ELABORATIVE_QUESTIONS as unknown as string[]) || ELABORATIVE_QUESTIONS[0];
});

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

  emit('complete');
}
</script>
```

### 6.7 Create Preview Component

Create `src/entities/elaborative-interrogation/Preview.vue`:

```vue
<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">{{ concept.name }}</h2>
    <MarkdownText v-if="concept.description" :text="concept.description" />
    <p class="text-sm text-gray-500">Practice will present random elaborative questions</p>
  </div>
</template>

<script setup lang="ts">
import type { ElaborativeInterrogationConcept } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  concept: ElaborativeInterrogationConcept;
}>();
</script>
```

### 6.8 Create Index Export

Create `src/entities/elaborative-interrogation/index.ts`:

```typescript
export { elaborativeInterrogationRepo } from './repo';
export type { ElaborativeInterrogationContract } from './contract';
export { ELABORATIVE_QUESTIONS } from './questions';
export { default as ElaborativeInterrogationRow } from './Row.vue';
export { default as ElaborativeInterrogationEdit } from './Edit.vue';
export { default as ElaborativeInterrogationPractice } from './Practice.vue';
export { default as ElaborativeInterrogationPreview } from './Preview.vue';
```

## File Structure

```
src/entities/elaborative-interrogation/
├── questions.ts
├── contract.ts
├── repo.ts
├── Row.vue
├── Edit.vue
├── Practice.vue
├── Preview.vue
└── index.ts
```

## Validation

- [ ] Repository implements contract correctly
- [ ] Row component shows name (bold) and truncated description
- [ ] Edit component allows editing name and optional description
- [ ] Practice component shows name, description, random question, and textarea
- [ ] "Done" button saves answer with timestamp to learning progress
- [ ] Preview component shows name and description
- [ ] Due items are those not answered in the last hour
- [ ] No imports from other entity folders
- [ ] ESLint passes

## Next Step

Proceed to `07-app-header.md` to implement the global AppHeader component.
