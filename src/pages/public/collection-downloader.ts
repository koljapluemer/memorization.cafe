import { collectionRepo } from '@/entities/collection/repo';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard/repo';
import { conceptRepo } from '@/entities/concept/repo';
import { listRepo } from '@/entities/list/repo';
import { clozeRepo } from '@/entities/cloze/repo';
import type { SharedCollection } from '@/features/collection-sharing';

/**
 * Downloads a shared collection to the local Dexie database
 *
 * @param sharedCollection - The shared collection data to import
 * @returns The ID of the newly created local collection
 */
export async function downloadCollection(sharedCollection: SharedCollection): Promise<string> {
  // Create the collection
  const collectionId = await collectionRepo.create({
    name: sharedCollection.collectionName,
    description: sharedCollection.collectionDescription,
  });

  // Import all learning items with the new collectionId
  const importPromises = [];

  // Import flashcards
  for (const flashcard of sharedCollection.items.flashcards) {
    const { id, ...flashcardData } = flashcard;
    void id;
    importPromises.push(
      simpleFlashcardRepo.create({
        ...flashcardData,
        collectionId,
      })
    );
  }

  // Import concepts
  for (const concept of sharedCollection.items.concepts) {
    const { id, ...conceptData } = concept;
    void id;
    importPromises.push(
      conceptRepo.create({
        ...conceptData,
        collectionId,
      })
    );
  }

  // Import lists
  for (const list of sharedCollection.items.lists) {
    const { id, ...listData } = list;
    void id;
    importPromises.push(
      listRepo.create({
        ...listData,
        collectionId,
      })
    );
  }

  // Import clozes
  for (const cloze of sharedCollection.items.clozes) {
    const { id, ...clozeData } = cloze;
    void id;
    importPromises.push(
      clozeRepo.create({
        ...clozeData,
        collectionId,
      })
    );
  }

  await Promise.all(importPromises);

  return collectionId;
}
