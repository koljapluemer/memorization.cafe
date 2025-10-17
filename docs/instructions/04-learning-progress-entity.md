# Step 4: Learning Progress Entity Implementation

## Overview
Implement the LearningProgress entity that stores user-specific progress data (ts-fsrs Card data and Elaborative Interrogation answers).

## Architecture Rules
- Entity folder: `src/entities/learning-progress/`
- May NOT import other entity folders
- References learning items by string ID only

## Tasks

### 4.1 Create Contract

Create `src/entities/learning-progress/contract.ts`:

```typescript
import type { LearningProgress } from '@/app/database';
import type { Card } from 'ts-fsrs';

export interface LearningProgressContract {
  getByLearningItemId(learningItemId: string): Promise<LearningProgress | undefined>;

  // For flashcards with ts-fsrs
  createFlashcardProgress(learningItemId: string, initialCard: Card): Promise<string>;
  updateFlashcardProgress(learningItemId: string, cardData: Card): Promise<void>;

  // For elaborative interrogation
  createConceptProgress(learningItemId: string): Promise<string>;
  addConceptAnswer(learningItemId: string, question: string, answer: string): Promise<void>;
  getLastAnswerTime(learningItemId: string): Promise<Date | null>;

  // General queries
  getAllProgressForItems(learningItemIds: string[]): Promise<LearningProgress[]>;
  delete(learningItemId: string): Promise<void>;
}
```

### 4.2 Create Repository

Create `src/entities/learning-progress/repo.ts`:

```typescript
import { db, type LearningProgress } from '@/app/database';
import type { LearningProgressContract } from './contract';
import type { Card } from 'ts-fsrs';

export const learningProgressRepo: LearningProgressContract = {
  async getByLearningItemId(learningItemId: string): Promise<LearningProgress | undefined> {
    return await db.learningProgress
      .where('learningItemId')
      .equals(learningItemId)
      .first();
  },

  async createFlashcardProgress(learningItemId: string, initialCard: Card): Promise<string> {
    const id = await db.learningProgress.add({
      learningItemId,
      itemType: 'flashcard',
      cardData: {
        due: initialCard.due,
        stability: initialCard.stability,
        difficulty: initialCard.difficulty,
        elapsed_days: initialCard.elapsed_days,
        scheduled_days: initialCard.scheduled_days,
        reps: initialCard.reps,
        lapses: initialCard.lapses,
        state: initialCard.state,
        last_review: initialCard.last_review,
      },
    } as LearningProgress);
    return id;
  },

  async updateFlashcardProgress(learningItemId: string, cardData: Card): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.update(existing.id, {
        cardData: {
          due: cardData.due,
          stability: cardData.stability,
          difficulty: cardData.difficulty,
          elapsed_days: cardData.elapsed_days,
          scheduled_days: cardData.scheduled_days,
          reps: cardData.reps,
          lapses: cardData.lapses,
          state: cardData.state,
          last_review: cardData.last_review,
        },
      });
    }
  },

  async createConceptProgress(learningItemId: string): Promise<string> {
    const id = await db.learningProgress.add({
      learningItemId,
      itemType: 'concept',
      answers: [],
    } as LearningProgress);
    return id;
  },

  async addConceptAnswer(learningItemId: string, question: string, answer: string): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      const answers = existing.answers || [];
      answers.push({
        question,
        answer,
        timestamp: new Date(),
      });
      await db.learningProgress.update(existing.id, { answers });
    }
  },

  async getLastAnswerTime(learningItemId: string): Promise<Date | null> {
    const progress = await this.getByLearningItemId(learningItemId);
    if (!progress?.answers || progress.answers.length === 0) {
      return null;
    }
    const lastAnswer = progress.answers[progress.answers.length - 1];
    return lastAnswer.timestamp;
  },

  async getAllProgressForItems(learningItemIds: string[]): Promise<LearningProgress[]> {
    return await db.learningProgress
      .where('learningItemId')
      .anyOf(learningItemIds)
      .toArray();
  },

  async delete(learningItemId: string): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.delete(existing.id);
    }
  },
};
```

### 4.3 Create Index Export

Create `src/entities/learning-progress/index.ts`:

```typescript
export { learningProgressRepo } from './repo';
export type { LearningProgressContract } from './contract';
export type { LearningProgress } from '@/app/database';
```

## File Structure

```
src/entities/learning-progress/
├── contract.ts  # Interface definition
├── repo.ts      # Dexie implementation
└── index.ts     # Public exports
```

## Notes

- This entity stores all user-specific learning progress
- For flashcards: stores ts-fsrs Card data
- For concepts: stores array of answers with timestamps
- Future: `owner` and `realmId` will keep this data private when sharing collections
- Progress is looked up by `learningItemId` (foreign key to flashcard/concept)

## Validation

- [ ] Contract defines all required methods
- [ ] Repository implements contract correctly
- [ ] Can create and update flashcard progress with ts-fsrs Card data
- [ ] Can create and add answers to concept progress
- [ ] No imports from other entity folders
- [ ] ESLint passes

## Next Step

Proceed to `05-simple-flashcard-entity.md` to implement the Simple Flashcard entity.
