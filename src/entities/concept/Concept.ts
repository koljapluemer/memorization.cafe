export interface Concept {
  id?: string;
  collectionId: string;
  name: string;
  description?: string;
  questionListId?: string; // References QuestionList.id
}
