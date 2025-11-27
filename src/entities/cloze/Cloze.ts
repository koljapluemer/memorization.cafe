export type ClozeStrategy = 'atSpace' | 'atEveryCharacter' | 'split';

export interface Cloze {
  id?: string;
  collectionId: string;
  preExercise?: string;
  postExercise?: string;
  content: string;
  clozeStrategy: ClozeStrategy;
  indices: number[];
}