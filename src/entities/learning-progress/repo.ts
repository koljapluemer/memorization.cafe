import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

import type { LearningProgressContract } from './contract';
import type { LearningProgress, ElementModelsMap } from './LearningProgress';

import { db } from '@/app/database';

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
      cardData: initialCard,
    } as LearningProgress);
    return id;
  },

  async updateFlashcardProgress(learningItemId: string, cardData: Card): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.update(existing.id, {
        cardData,
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
    return lastAnswer?.timestamp ?? null;
  },

  async getAllProgressForItems(learningItemIds: string[]): Promise<LearningProgress[]> {
    return await db.learningProgress
      .where('learningItemId')
      .anyOf(learningItemIds)
      .toArray();
  },

  async createEbisuProgress(learningItemId: string, itemType: 'list', initialModel: EbisuModel): Promise<string> {
    const id = await db.learningProgress.add({
      learningItemId,
      itemType,
      listData: {
        model: initialModel,
        lastReviewTimestamp: new Date(),
      },
    } as LearningProgress);
    return id;
  },

  async updateEbisuProgress(learningItemId: string, model: EbisuModel): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.update(existing.id, {
        listData: {
          model,
          lastReviewTimestamp: new Date(),
        },
      });
    }
  },

  async delete(learningItemId: string): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.delete(existing.id);
    }
  },

  async createEbisuProgressWithElements(
    learningItemId: string,
    itemType: 'list',
    initialModel: EbisuModel,
    elementModels: ElementModelsMap
  ): Promise<string> {
    const id = await db.learningProgress.add({
      learningItemId,
      itemType,
      listData: {
        model: initialModel,
        lastReviewTimestamp: new Date(),
        elementModels,
      },
    } as LearningProgress);
    return id;
  },

  async updateEbisuProgressWithElements(
    learningItemId: string,
    listModel: EbisuModel,
    elementModels: ElementModelsMap
  ): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.update(existing.id, {
        listData: {
          model: listModel,
          lastReviewTimestamp: new Date(),
          elementModels,
        },
      });
    }
  },

  async createIntroductionProgress(
    learningItemId: string,
    itemType: 'flashcard' | 'cloze' | 'list',
    initialData?: { card?: Card; listModel?: EbisuModel; elementModels?: ElementModelsMap }
  ): Promise<string> {
    const progress: LearningProgress = {
      learningItemId,
      itemType,
      introductionTimestamp: new Date(),
    };

    // Initialize scheduling models based on item type
    if (itemType === 'flashcard' || itemType === 'cloze') {
      if (initialData?.card) {
        progress.cardData = initialData.card;
      }
    } else if (itemType === 'list') {
      if (initialData?.listModel) {
        progress.listData = {
          model: initialData.listModel,
          lastReviewTimestamp: new Date(),
          elementModels: initialData.elementModels || {},
        };
      }
    }

    const id = await db.learningProgress.add(progress);
    return id;
  },
};
