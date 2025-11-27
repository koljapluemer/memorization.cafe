import type { Duration } from "@/dumb/Duration";


export interface Concept {
  id?: string;
  collectionId: string;
  name: string;
  description?: string;
  questionListId?: string; // References QuestionList.id
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}
