import type { QuestionList } from '@/app/database';

export interface QuestionListContract {
  getAll(): Promise<QuestionList[]>;
  getById(id: string): Promise<QuestionList | undefined>;
  getDefault(): Promise<QuestionList>;
  create(data: Omit<QuestionList, 'id'>): Promise<string>;
  update(id: string, data: Partial<QuestionList>): Promise<void>;
  setAsDefault(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
