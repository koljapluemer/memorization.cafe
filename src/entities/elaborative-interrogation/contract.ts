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
