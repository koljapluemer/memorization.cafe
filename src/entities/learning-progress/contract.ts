import type { Card } from 'ts-fsrs';

import type { LearningProgress } from '@/app/database';

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
