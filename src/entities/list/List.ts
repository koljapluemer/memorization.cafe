import type { Duration } from "@/dumb/Duration";

export interface List {
  id?: string;
  collectionId: string;
  name: string;
  items: string[];
  isOrderedList: boolean;
  note?: string;
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}