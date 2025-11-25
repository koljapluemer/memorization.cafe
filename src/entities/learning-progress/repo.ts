import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

import type { LearningProgressContract } from './contract';

import { db, type LearningProgress, type ElementModelsMap } from '@/app/database';

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

  async updateHelperNote(learningItemId: string, helperNote: string): Promise<void> {
    const existing = await this.getByLearningItemId(learningItemId);
    if (existing?.id) {
      await db.learningProgress.update(existing.id, { helperNote });
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
};
