import type { QuestionListContract } from './contract';

import { db, type QuestionList } from '@/app/database';

const DEFAULT_QUESTIONS = [
  'When does this concept apply?',
  'When does this concept not apply?',
  'What problem does this concept solve?',
  'Explain this concept to a five year old',
];

export const questionListRepo: QuestionListContract = {
  async getAll(): Promise<QuestionList[]> {
    return await db.questionLists.toArray();
  },

  async getById(id: string): Promise<QuestionList | undefined> {
    return await db.questionLists.get(id);
  },

  async getDefault(): Promise<QuestionList> {
    // Find the list marked as default (can't use .equals() on boolean in Dexie)
    const allLists = await db.questionLists.toArray();
    let defaultList = allLists.find(list => list.isDefault === true);

    if (!defaultList) {
      // No default exists, create one
      const id = await db.questionLists.add({
        name: 'Default Questions',
        questions: [...DEFAULT_QUESTIONS],
        isDefault: true,
      });
      defaultList = await db.questionLists.get(id);
    }

    return defaultList!;
  },

  async create(data: Omit<QuestionList, 'id'>): Promise<string> {
    const id = await db.questionLists.add(data as QuestionList);
    return id;
  },

  async update(id: string, data: Partial<QuestionList>): Promise<void> {
    await db.questionLists.update(id, data);
  },

  async setAsDefault(id: string): Promise<void> {
    // First, unset all other defaults
    const allLists = await db.questionLists.toArray();
    for (const list of allLists) {
      if (list.id !== id && list.isDefault) {
        await db.questionLists.update(list.id!, { isDefault: false });
      }
    }

    // Then set this one as default
    await db.questionLists.update(id, { isDefault: true });
  },

  async delete(id: string): Promise<void> {
    const listToDelete = await db.questionLists.get(id);

    if (listToDelete?.isDefault) {
      // If we're deleting the default, check if there are other lists
      const allLists = await db.questionLists.toArray();

      if (allLists.length > 1) {
        // Make another list the default
        const otherList = allLists.find(l => l.id !== id);
        if (otherList?.id) {
          await db.questionLists.update(otherList.id, { isDefault: true });
        }
      }
      // If it's the only list, we'll delete it and getDefault() will create a new one when needed
    }

    await db.questionLists.delete(id);
  },
};
