import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

import type { FlashcardRecord } from '../entities/flashcard';
import type { VerbatimItemRecord } from '../entities/verbatim-item';

export interface CloudSyncSettings {
  databaseUrl: string;
  requireAuth: boolean;
  accessToken?: string;
}

export class MemorizationDB extends Dexie {
  flashcards!: Table<FlashcardRecord, string>;
  verbatimItems!: Table<VerbatimItemRecord, string>;

  constructor() {
    super('memorizationCafe', { addons: [dexieCloud] });
    this.version(1).stores({
      flashcards: '@id, nextReview, createdAt',
      verbatimItems: '@id, nextReview, createdAt',
    });
  }

  configureCloudSync(settings: CloudSyncSettings | null): void {
    const potential = (this as unknown as {
      cloud?: {
        configure?: (_options: unknown) => void;
        login?: (_options: unknown) => Promise<unknown>;
      };
    }).cloud;

    if (!potential || typeof potential.configure !== 'function') {
      return;
    }

    if (!settings || !settings.databaseUrl) {
      return;
    }

    potential.configure({
      databaseUrl: settings.databaseUrl,
      requireAuth: settings.requireAuth,
    });

    if (settings.accessToken) {
      potential.login?.({ accessToken: settings.accessToken }).catch(() => {
        // swallow errors for now; user can retry from settings page
      });
    }
  }
}
