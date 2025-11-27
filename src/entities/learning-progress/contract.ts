import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

import type { LearningProgress, ElementModelsMap } from './LearningProgress';

export interface LearningProgressContract {
  getByLearningItemId(learningItemId: string): Promise<LearningProgress | undefined>;

  // For flashcards with ts-fsrs
  createFlashcardProgress(learningItemId: string, initialCard: Card): Promise<string>;
  updateFlashcardProgress(learningItemId: string, cardData: Card): Promise<void>;

  // For elaborative interrogation
  createConceptProgress(learningItemId: string): Promise<string>;
  addConceptAnswer(learningItemId: string, question: string, answer: string): Promise<void>;
  getLastAnswerTime(learningItemId: string): Promise<Date | null>;

  // For items using ebisu.js (like lists)
  createEbisuProgress(learningItemId: string, itemType: 'list', initialModel: EbisuModel): Promise<string>;
  updateEbisuProgress(learningItemId: string, model: EbisuModel): Promise<void>;
  createEbisuProgressWithElements(learningItemId: string, itemType: 'list', initialModel: EbisuModel, elementModels: ElementModelsMap): Promise<string>;
  updateEbisuProgressWithElements(learningItemId: string, listModel: EbisuModel, elementModels: ElementModelsMap): Promise<void>;

  // General queries
  getAllProgressForItems(learningItemIds: string[]): Promise<LearningProgress[]>;
  delete(learningItemId: string): Promise<void>;

  // Helper note
  updateHelperNote(learningItemId: string, helperNote: string): Promise<void>;

  // Introduction progress (for new items before full practice)
  createIntroductionProgress(
    learningItemId: string,
    itemType: 'flashcard' | 'cloze' | 'list',
    initialData?: { card?: Card; listModel?: EbisuModel; elementModels?: ElementModelsMap }
  ): Promise<string>;
}
