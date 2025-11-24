import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';

export interface SharedCollection {
  shareId: string;
  collectionName: string;
  collectionDescription?: string;
  authorName: string;
  createdAt: number; // timestamp
  viewCount: number;
  downloadCount: number;
  items: {
    flashcards: SimpleFlashcard[];
    concepts: ElaborativeInterrogationConcept[];
    lists: List[];
    clozes: Cloze[];
  };
}

export interface ShareResult {
  shareId: string;
  shareUrl: string;
}
