import type { Duration } from "@/dumb/Duration";

export interface SimpleFlashcard {
  id?: string;
  collectionId: string;
  front: string;
  back: string;
  practiceAsFlashcard: boolean;
  practiceAsPrompt: boolean;
  practiceReverse?: boolean;
  isDisabled?: boolean;
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
  frontImage?: string;
  frontImageLabel?: string;
  backImage?: string;
  backImageLabel?: string;
}