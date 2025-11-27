import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

export type ElementModelsMap = {
  [itemKey: string]: {
    model: EbisuModel;
    lastReviewTimestamp: Date;
    addedAt: Date;
  }
}; 



export interface LearningProgress {
  id?: string;
  learningItemId: string; // References flashcard, concept, list, or cloze
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  owner?: string; // Current user ID (keeps progress private)

  // For flashcards (ts-fsrs Card data)
  cardData?: Card;

  // For elaborative interrogation
  answers?: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;

  // For lists (ebisu.js Model data)
  listData?: {
    model: EbisuModel;
    lastReviewTimestamp: Date;
    elementModels?: ElementModelsMap;
  };

  // Helper note for remembering the item
  helperNote?: string;

  // When item was first introduced to user (before full practice)
  introductionTimestamp?: Date;
}
