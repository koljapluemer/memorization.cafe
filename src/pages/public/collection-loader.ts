import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

import { firestore, isFirebaseConfigured } from '@/app/firebase';
import type { SharedCollection } from '@/features/collection-sharing';

/**
 * Loads a shared collection from Firestore
 *
 * @param shareId - The share ID from the URL
 * @returns The shared collection data
 * @throws Error if Firebase is not configured or collection not found
 */
export async function loadSharedCollection(shareId: string): Promise<SharedCollection> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const docRef = doc(firestore, 'shared-collections', shareId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Collection not found');
  }

  return docSnap.data() as SharedCollection;
}

/**
 * Increments the view count for a shared collection
 *
 * @param shareId - The share ID
 */
export async function incrementViewCount(shareId: string): Promise<void> {
  if (!isFirebaseConfigured() || !firestore) {
    return; // Silently fail if Firebase not configured
  }

  try {
    const docRef = doc(firestore, 'shared-collections', shareId);
    await updateDoc(docRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Failed to increment view count:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Increments the download count for a shared collection
 *
 * @param shareId - The share ID
 */
export async function incrementDownloadCount(shareId: string): Promise<void> {
  if (!isFirebaseConfigured() || !firestore) {
    return; // Silently fail if Firebase not configured
  }

  try {
    const docRef = doc(firestore, 'shared-collections', shareId);
    await updateDoc(docRef, {
      downloadCount: increment(1),
    });
  } catch (error) {
    console.error('Failed to increment download count:', error);
    // Don't throw - this is not critical
  }
}
