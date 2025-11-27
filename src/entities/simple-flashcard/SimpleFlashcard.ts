export interface SimpleFlashcard {
  id?: string;
  collectionId: string;
  front: string;
  back: string;
  practiceAsFlashcard: boolean;
  practiceAsPrompt: boolean;
  practiceReverse?: boolean;
  isDisabled?: boolean;
  frontImage?: string;
  frontImageLabel?: string;
  backImage?: string;
  backImageLabel?: string;
}