# Step 5: Simple Flashcard Entity Implementation

## Overview
Implement the Simple Flashcard learning item with all required components: repo, contract, Row.vue, Edit.vue, Practice.vue, and Preview.vue.

## Architecture Rules
- Entity folder: `src/entities/simple-flashcard/`
- May NOT import other entity folders (reference by string ID only)
- Can import from `dumb/` folder for utilities

## Tasks

### 5.1 Create Contract

Create `src/entities/simple-flashcard/contract.ts`:

```typescript
import type { SimpleFlashcard } from '@/app/database';

export interface SimpleFlashcardContract {
  getAll(): Promise<SimpleFlashcard[]>;
  getByCollectionId(collectionId: string): Promise<SimpleFlashcard[]>;
  getById(id: string): Promise<SimpleFlashcard | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<SimpleFlashcard | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<SimpleFlashcard | null>;

  create(data: Omit<SimpleFlashcard, 'id'>): Promise<string>;
  update(id: string, data: Partial<SimpleFlashcard>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 5.2 Create Repository

Create `src/entities/simple-flashcard/repo.ts`:

```typescript
import { db, type SimpleFlashcard } from '@/app/database';
import type { SimpleFlashcardContract } from './contract';
import { learningProgressRepo } from '@/entities/learning-progress';
import { getRandomItem } from '@/dumb/array-utils';

export const simpleFlashcardRepo: SimpleFlashcardContract = {
  async getAll(): Promise<SimpleFlashcard[]> {
    return await db.flashcards.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<SimpleFlashcard[]> {
    return await db.flashcards.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<SimpleFlashcard | undefined> {
    return await db.flashcards.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<SimpleFlashcard | null> {
    const allFlashcards = await db.flashcards
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allFlashcards.length === 0) return null;

    const flashcardIds = allFlashcards.map(f => f.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(flashcardIds);

    const dueFlashcards = allFlashcards.filter(flashcard => {
      const progress = progressRecords.find(p => p.learningItemId === flashcard.id);
      if (!progress?.cardData) return false;
      return progress.cardData.due <= now;
    });

    return getRandomItem(dueFlashcards);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<SimpleFlashcard | null> {
    const allFlashcards = await db.flashcards
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newFlashcards = allFlashcards.filter(f => !existingProgressIds.includes(f.id!));
    return getRandomItem(newFlashcards);
  },

  async create(data: Omit<SimpleFlashcard, 'id'>): Promise<string> {
    const id = await db.flashcards.add(data as SimpleFlashcard);
    return id;
  },

  async update(id: string, data: Partial<SimpleFlashcard>): Promise<void> {
    await db.flashcards.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.flashcards.delete(id);
    // Also delete associated progress
    await learningProgressRepo.delete(id);
  },
};
```

### 5.3 Create Array Utils (Dumb Component)

Create `src/dumb/array-utils.ts`:

```typescript
export function getRandomItem<T>(array: T[]): T | null {
  if (array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
```

### 5.4 Create Markdown Renderer (Dumb Component)

Create `src/dumb/MarkdownText.vue`:

```vue
<template>
  <div v-html="renderedMarkdown" class="prose"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  text: string;
}>();

const renderedMarkdown = computed(() => {
  return marked(props.text);
});
</script>
```

**Note**: Install marked: `npm install marked`

### 5.5 Create Row Component

Create `src/entities/simple-flashcard/Row.vue`:

```vue
<template>
  <span>{{ truncatedFront }} | {{ truncatedBack }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SimpleFlashcard } from '@/app/database';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

function truncate(text: string, maxLength: number = 20): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const truncatedFront = computed(() => truncate(props.flashcard.front));
const truncatedBack = computed(() => truncate(props.flashcard.back));
</script>
```

### 5.6 Create Edit Component

Create `src/entities/simple-flashcard/Edit.vue`:

```vue
<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label for="front" class="label">
        <span class="label-text">Front</span>
      </label>
      <textarea
        id="front"
        v-model="localFront"
        placeholder="Front of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </div>

    <div class="form-control w-full">
      <label for="back" class="label">
        <span class="label-text">Back</span>
      </label>
      <textarea
        id="back"
        v-model="localBack"
        placeholder="Back of flashcard (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SimpleFlashcard } from '@/app/database';

const props = defineProps<{
  flashcard?: SimpleFlashcard;
}>();

const emit = defineEmits<{
  update: [data: { front: string; back: string }];
}>();

const localFront = ref(props.flashcard?.front || '');
const localBack = ref(props.flashcard?.back || '');

watch([localFront, localBack], () => {
  emit('update', {
    front: localFront.value,
    back: localBack.value,
  });
});
</script>
```

### 5.7 Create Practice Component

Create `src/entities/simple-flashcard/Practice.vue`:

```vue
<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />

    <div v-if="!revealed" class="flex justify-center">
      <button @click="revealed = true" class="btn">Reveal</button>
    </div>

    <template v-if="revealed">
      <div class="divider"></div>
      <MarkdownText :text="flashcard.back" />

      <div class="flex gap-2 justify-center mt-4">
        <button @click="handleRating(Rating.Again)" class="btn">Again</button>
        <button @click="handleRating(Rating.Hard)" class="btn">Hard</button>
        <button @click="handleRating(Rating.Good)" class="btn">Good</button>
        <button @click="handleRating(Rating.Easy)" class="btn">Easy</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';
import type { SimpleFlashcard } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress';
import MarkdownText from '@/dumb/MarkdownText.vue';

const props = defineProps<{
  flashcard: SimpleFlashcard;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const revealed = ref(false);
const f = fsrs();

async function handleRating(rating: Rating) {
  const progress = await learningProgressRepo.getByLearningItemId(props.flashcard.id!);

  let card = progress?.cardData ? {
    due: progress.cardData.due,
    stability: progress.cardData.stability,
    difficulty: progress.cardData.difficulty,
    elapsed_days: progress.cardData.elapsed_days,
    scheduled_days: progress.cardData.scheduled_days,
    reps: progress.cardData.reps,
    lapses: progress.cardData.lapses,
    state: progress.cardData.state,
    last_review: progress.cardData.last_review,
  } : createEmptyCard();

  const schedulingCards = f.repeat(card, new Date());
  const updatedCard = schedulingCards[rating].card;

  if (progress) {
    await learningProgressRepo.updateFlashcardProgress(props.flashcard.id!, updatedCard);
  } else {
    await learningProgressRepo.createFlashcardProgress(props.flashcard.id!, updatedCard);
  }

  emit('complete');
}
</script>
```

### 5.8 Create Preview Component

Create `src/entities/simple-flashcard/Preview.vue`:

```vue
<template>
  <div class="space-y-4">
    <MarkdownText :text="flashcard.front" />
    <div class="divider"></div>
    <MarkdownText :text="flashcard.back" />
  </div>
</template>

<script setup lang="ts">
import type { SimpleFlashcard } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  flashcard: SimpleFlashcard;
}>();
</script>
```

### 5.9 Create Index Export

Create `src/entities/simple-flashcard/index.ts`:

```typescript
export { simpleFlashcardRepo } from './repo';
export type { SimpleFlashcardContract } from './contract';
export { default as SimpleFlashcardRow } from './Row.vue';
export { default as SimpleFlashcardEdit } from './Edit.vue';
export { default as SimpleFlashcardPractice } from './Practice.vue';
export { default as SimpleFlashcardPreview } from './Preview.vue';
```

## File Structure

```
src/entities/simple-flashcard/
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
- [ ] Row component shows truncated front | back
- [ ] Edit component allows editing front and back (markdown support)
- [ ] Practice component shows front, reveal button, then back with rating buttons
- [ ] Preview component shows front + divider + back
- [ ] ts-fsrs integration works (card updates on rating)
- [ ] No imports from other entity folders
- [ ] ESLint passes

## Next Step

Proceed to `06-elaborative-interrogation-entity.md` to implement the Elaborative Interrogation entity.
