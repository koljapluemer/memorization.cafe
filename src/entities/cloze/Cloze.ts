import type { Duration } from "@/dumb/Duration";

export type ClozeStrategy = 'atSpace' | 'atEveryCharacter' | 'split';

export interface Cloze {
  id?: string;
  collectionId: string;
  preExercise?: string;
  postExercise?: string;
  content: string;
  clozeStrategy: ClozeStrategy;
  indices: number[];
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}