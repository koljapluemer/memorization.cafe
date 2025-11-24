import { doc, setDoc } from 'firebase/firestore';

import { firestore, isFirebaseConfigured } from '@/app/firebase';
import { collectionRepo } from '@/entities/collection';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';
import { elaborativeInterrogationRepo } from '@/entities/elaborative-interrogation';
import { listRepo } from '@/entities/list';
import { clozeRepo } from '@/entities/cloze';
import type { ShareResult, SharedCollection } from './types';

/**
 * Generates a unique share ID (12 characters, URL-safe)
 */
function generateShareId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    result += chars[array[i]! % chars.length];
  }
  return result;
}

/**
 * Shares a collection by uploading it to Firestore
 *
 * @param collectionId - The ID of the collection to share
 * @param authorName - The name to display as the author
 * @returns Share ID and shareable URL
 * @throws Error if Firebase is not configured or collection not found
 */
export async function shareCollection(
  collectionId: string,
  authorName: string
): Promise<ShareResult> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add Firebase credentials to your .env file.');
  }

  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  // Fetch the collection
  const collection = await collectionRepo.getById(collectionId);
  if (!collection) {
    throw new Error('Collection not found');
  }

  // Fetch all learning items
  const [flashcards, concepts, lists, clozes] = await Promise.all([
    simpleFlashcardRepo.getByCollectionId(collectionId),
    elaborativeInterrogationRepo.getByCollectionId(collectionId),
    listRepo.getByCollectionId(collectionId),
    clozeRepo.getByCollectionId(collectionId),
  ]);

  // Generate share ID
  const shareId = generateShareId();

  // Create shared collection document
  const sharedCollection: SharedCollection = {
    shareId,
    collectionName: collection.name,
    collectionDescription: collection.description,
    authorName: authorName.trim() || 'Anonymous',
    createdAt: Date.now(),
    viewCount: 0,
    downloadCount: 0,
    items: {
      flashcards,
      concepts,
      lists,
      clozes,
    },
  };

  // Remove undefined fields (Firestore doesn't support them)
  if (sharedCollection.collectionDescription === undefined) {
    delete sharedCollection.collectionDescription;
  }

  // Save to Firestore
  const docRef = doc(firestore, 'shared-collections', shareId);
  await setDoc(docRef, sharedCollection);

  // Generate shareable URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/public/${shareId}`;

  return {
    shareId,
    shareUrl,
  };
}
