import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';

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
    concepts: Concept[];
    lists: List[];
    clozes: Cloze[];
  };
}

export interface ShareResult {
  shareId: string;
  shareUrl: string;
}
