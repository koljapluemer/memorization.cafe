import type { Concept } from "./Concept";

export interface ConceptContract {
  getAll(): Promise<Concept[]>;
  getByCollectionId(collectionId: string): Promise<Concept[]>;
  getById(id: string): Promise<Concept | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<Concept | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Concept | null>;

  create(data: Omit<Concept, 'id'>): Promise<string>;
  update(id: string, data: Partial<Concept>): Promise<void>;
  delete(id: string): Promise<void>;
}
