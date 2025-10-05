import type { App, InjectionKey, Ref } from 'vue';
import { inject, ref } from 'vue';

import { MemorizationDB, type CloudSyncSettings } from './database';
import {
  createFlashcardRepository,
  type FlashcardRepository,
} from '../entities/flashcard';
import {
  createVerbatimRepository,
  type VerbatimRepository,
} from '../entities/verbatim-item';

type CloudSettingsContext = {
  settings: Ref<CloudSyncSettings | null>;
  update: (value: CloudSyncSettings | null) => void;
};

const flashcardRepositoryKey: InjectionKey<FlashcardRepository> = Symbol('flashcardRepository');
const verbatimRepositoryKey: InjectionKey<VerbatimRepository> = Symbol('verbatimRepository');
const cloudSettingsKey: InjectionKey<CloudSettingsContext> = Symbol('cloudSettings');

const db = new MemorizationDB();

const flashcardRepository = createFlashcardRepository(db);
const verbatimRepository = createVerbatimRepository(db);

const storedSettings = loadCloudSettings();
const cloudSettings = ref<CloudSyncSettings | null>(storedSettings);
if (storedSettings) {
  db.configureCloudSync(storedSettings);
}

function persistCloudSettings(settings: CloudSyncSettings | null) {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return;
  }
  if (!settings || !settings.databaseUrl) {
    globalThis.localStorage?.removeItem('memorizationCafe.cloud');
    return;
  }

  globalThis.localStorage?.setItem('memorizationCafe.cloud', JSON.stringify(settings));
}

function loadCloudSettings(): CloudSyncSettings | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  try {
    const raw = globalThis.localStorage?.getItem('memorizationCafe.cloud');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CloudSyncSettings;
  } catch (error) {
    if (globalThis.console) {
      globalThis.console.warn('Failed to parse cloud settings', error);
    }
    return null;
  }
}

const cloudContext: CloudSettingsContext = {
  settings: cloudSettings,
  update(value) {
    cloudSettings.value = value && value.databaseUrl ? { ...value } : null;
    db.configureCloudSync(cloudSettings.value);
    persistCloudSettings(cloudSettings.value);
  },
};

export function registerAppProviders(app: App) {
  app.provide(flashcardRepositoryKey, flashcardRepository);
  app.provide(verbatimRepositoryKey, verbatimRepository);
  app.provide(cloudSettingsKey, cloudContext);
}

export function useFlashcardRepository(): FlashcardRepository {
  const repository = inject(flashcardRepositoryKey);
  if (!repository) {
    throw new Error('FlashcardRepository not provided');
  }
  return repository;
}

export function useVerbatimRepository(): VerbatimRepository {
  const repository = inject(verbatimRepositoryKey);
  if (!repository) {
    throw new Error('VerbatimRepository not provided');
  }
  return repository;
}

export function useCloudSettings(): CloudSettingsContext {
  const context = inject(cloudSettingsKey);
  if (!context) {
    throw new Error('Cloud settings context not provided');
  }
  return context;
}
