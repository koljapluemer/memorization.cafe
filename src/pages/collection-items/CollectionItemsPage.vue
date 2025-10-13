<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <nav class="breadcrumbs text-sm">
          <ul>
            <li>
              <RouterLink to="/collections/list">
                Collections
              </RouterLink>
            </li>
            <li>
              {{ collection?.title ?? 'Collection' }}
            </li>
          </ul>
        </nav>

        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-xl font-semibold">
              {{ collection?.title ?? 'Collection' }}
            </h1>
            <p
              v-if="collection?.description"
              class="text-sm text-base-content/70"
            >
              {{ collection.description }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary"
              @click="openLearningItemModal('create')"
            >
              Add item
            </button>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="isLoadingCollection"
      class="card bg-base-100 shadow"
    >
      <div class="card-body">
        <p>Loading collection...</p>
      </div>
    </div>

    <div v-else>
      <div
        v-if="isLoadingItems"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <p>Loading learning items...</p>
        </div>
      </div>
      <div
        v-else-if="orderedItems.length === 0"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <p>
            No learning items in this collection yet. Add your first item to begin organising materials.
          </p>
        </div>
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="item in orderedItems"
          :key="item.id"
          class="card bg-base-100 shadow"
        >
          <div class="card-body space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex-1">
                <h2 class="card-title">
                  {{ item.name }}
                </h2>
                <p
                  v-if="item.description"
                  class="text-sm text-base-content/70"
                >
                  {{ item.description }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-sm"
                  @click="openLearningItemModal('edit', item)"
                >
                  Edit item
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-error"
                  @click="confirmLearningItemDelete(item)"
                >
                  Delete
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  @click="toggleExpanded(item.id)"
                >
                  {{ expandedItemIds.has(item.id) ? 'Hide details' : 'Show details' }}
                </button>
              </div>
            </div>

            <div
              v-if="expandedItemIds.has(item.id)"
              class="space-y-6 border-t border-base-200 pt-4"
            >
              <section class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h3 class="font-semibold">
                    Flashcards ({{ flashcardsByItem[item.id]?.length ?? 0 }})
                  </h3>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="openFlashcardModal('create', item.id)"
                  >
                    Add flashcard
                  </button>
                </div>
                <div
                  v-if="!flashcardsReady"
                  class="rounded-lg border border-dashed border-base-300 p-4 text-sm text-base-content/60"
                >
                  Loading flashcards...
                </div>
                <div
                  v-else-if="!flashcardsByItem[item.id]?.length"
                  class="rounded-lg border border-dashed border-base-300 p-4 text-sm text-base-content/60"
                >
                  No flashcards yet.
                </div>
                <div
                  v-else
                  class="space-y-3"
                >
                  <article
                    v-for="card in flashcardsByItem[item.id] ?? []"
                    :key="card.id"
                    class="space-y-3 rounded-lg border border-base-200 p-4"
                  >
                    <div class="space-y-2">
                      <span class="text-xs font-semibold uppercase text-base-content/50">
                        Front
                      </span>
                      <MarkdownPreview :source="card.front" />
                    </div>
                    <div class="space-y-2">
                      <span class="text-xs font-semibold uppercase text-base-content/50">
                        Back
                      </span>
                      <MarkdownPreview :source="card.back" />
                    </div>
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="btn btn-sm"
                        @click="openFlashcardModal('edit', item.id, card)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-error"
                        @click="confirmFlashcardDelete(card)"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              <section class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h3 class="font-semibold">
                    Verbatim passages ({{ verbatimByItem[item.id]?.length ?? 0 }})
                  </h3>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="openVerbatimModal('create', item.id)"
                  >
                    Add passage
                  </button>
                </div>
                <div
                  v-if="!verbatimReady"
                  class="rounded-lg border border-dashed border-base-300 p-4 text-sm text-base-content/60"
                >
                  Loading passages...
                </div>
                <div
                  v-else-if="!verbatimByItem[item.id]?.length"
                  class="rounded-lg border border-dashed border-base-300 p-4 text-sm text-base-content/60"
                >
                  No passages yet.
                </div>
                <div
                  v-else
                  class="space-y-3"
                >
                  <article
                    v-for="passage in verbatimByItem[item.id] ?? []"
                    :key="passage.id"
                    class="space-y-3 rounded-lg border border-base-200 p-4"
                  >
                    <div
                      v-if="passage.preExercise"
                      class="space-y-2"
                    >
                      <span class="text-xs font-semibold uppercase text-base-content/50">
                        Pre exercise
                      </span>
                      <MarkdownPreview :source="passage.preExercise" />
                    </div>
                    <div class="space-y-2">
                      <span class="text-xs font-semibold uppercase text-base-content/50">
                        To memorise
                      </span>
                      <MarkdownPreview :source="passage.toMemorize" />
                    </div>
                    <div
                      v-if="passage.postExercise"
                      class="space-y-2"
                    >
                      <span class="text-xs font-semibold uppercase text-base-content/50">
                        Post exercise
                      </span>
                      <MarkdownPreview :source="passage.postExercise" />
                    </div>
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="btn btn-sm"
                        @click="openVerbatimModal('edit', item.id, passage)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-error"
                        @click="confirmVerbatimDelete(passage)"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal"
      :class="{ 'modal-open': learningItemModal.open }"
    >
      <div class="modal-box max-w-lg">
        <h3 class="mb-4 text-lg font-semibold">
          {{ learningItemModal.mode === 'create' ? 'Add learning item' : 'Edit learning item' }}
        </h3>
        <form
          class="space-y-4"
          @submit.prevent="submitLearningItem"
        >
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Name</span>
            </div>
            <input
              v-model="learningItemModal.form.name"
              type="text"
              class="input input-bordered"
              placeholder="Learning item name"
              required
            >
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Description</span>
            </div>
            <textarea
              v-model="learningItemModal.form.description"
              class="textarea textarea-bordered h-24"
              placeholder="Optional description"
            />
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Collection</span>
            </div>
            <select
              v-model="learningItemModal.form.collectionId"
              class="select select-bordered"
            >
              <option value="">
                None
              </option>
              <option
                v-for="option in availableCollections"
                :key="option.id"
                :value="option.id"
              >
                {{ option.title }}
              </option>
            </select>
          </label>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="closeLearningItemModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="learningItemModal.isSaving || !learningItemModal.form.name.trim()"
            >
              {{ learningItemModal.mode === 'create' ? 'Create item' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
      <div
        class="modal-backdrop"
        @click="closeLearningItemModal"
      />
    </div>

    <div
      class="modal"
      :class="{ 'modal-open': flashcardModal.open }"
    >
      <div class="modal-box max-w-2xl">
        <h3 class="mb-2 text-lg font-semibold">
          {{ flashcardModal.mode === 'create' ? 'Add flashcard' : 'Edit flashcard' }}
        </h3>
        <p class="mb-4 text-sm text-base-content/70">
          Linked to: {{ flashcardModal.learningItemName ?? '...' }}
        </p>
        <form
          class="space-y-4"
          @submit.prevent="submitFlashcard"
        >
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Front</span>
            </div>
            <textarea
              v-model="flashcardModal.form.front"
              class="textarea textarea-bordered h-32"
              placeholder="Prompt or question"
              required
            />
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Back</span>
            </div>
            <textarea
              v-model="flashcardModal.form.back"
              class="textarea textarea-bordered h-32"
              placeholder="Answer or explanation"
              required
            />
          </label>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="closeFlashcardModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="flashcardModal.isSaving || !flashcardModal.form.front.trim() || !flashcardModal.form.back.trim()"
            >
              {{ flashcardModal.mode === 'create' ? 'Create flashcard' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
      <div
        class="modal-backdrop"
        @click="closeFlashcardModal"
      />
    </div>

    <div
      class="modal"
      :class="{ 'modal-open': verbatimModal.open }"
    >
      <div class="modal-box max-w-2xl">
        <h3 class="mb-2 text-lg font-semibold">
          {{ verbatimModal.mode === 'create' ? 'Add verbatim passage' : 'Edit verbatim passage' }}
        </h3>
        <p class="mb-4 text-sm text-base-content/70">
          Linked to: {{ verbatimModal.learningItemName ?? '...' }}
        </p>
        <form
          class="space-y-4"
          @submit.prevent="submitVerbatim"
        >
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Pre exercise</span>
            </div>
            <textarea
              v-model="verbatimModal.form.preExercise"
              class="textarea textarea-bordered h-24"
              placeholder="Optional context"
            />
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">To memorise *</span>
            </div>
            <textarea
              v-model="verbatimModal.form.toMemorize"
              class="textarea textarea-bordered h-32"
              placeholder="Passage to memorise"
              required
            />
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Post exercise</span>
            </div>
            <textarea
              v-model="verbatimModal.form.postExercise"
              class="textarea textarea-bordered h-24"
              placeholder="Optional follow-up"
            />
          </label>
          <div class="modal-action">
            <button
              type="button"
              class="btn"
              @click="closeVerbatimModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="verbatimModal.isSaving || !verbatimModal.form.toMemorize.trim()"
            >
              {{ verbatimModal.mode === 'create' ? 'Create passage' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
      <div
        class="modal-backdrop"
        @click="closeVerbatimModal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import MarkdownPreview from '../../dumb/MarkdownPreview.vue';
import {
  useCollectionRepository,
  useFlashcardRepository,
  useLearningItemRepository,
  useVerbatimRepository,
} from '../../app/providers';
import type { CollectionRecord } from '../../entities/collection';
import type { LearningItemRecord } from '../../entities/learning-item';
import type { FlashcardRecord } from '../../entities/flashcard';
import type { VerbatimItemRecord } from '../../entities/verbatim-item';

const route = useRoute();
const router = useRouter();

const collectionRepository = useCollectionRepository();
const learningItemRepository = useLearningItemRepository();
const flashcardRepository = useFlashcardRepository();
const verbatimRepository = useVerbatimRepository();

const collectionId = ref<string | null>(null);
const collection = ref<CollectionRecord | null>(null);
const isLoadingCollection = ref(true);
const isLoadingItems = ref(true);

const learningItems = ref<LearningItemRecord[]>([]);
const rawFlashcards = ref<FlashcardRecord[]>([]);
const rawVerbatimItems = ref<VerbatimItemRecord[]>([]);
const collectionOptions = ref<CollectionRecord[]>([]);

const flashcardsReady = ref(false);
const verbatimReady = ref(false);

const expandedItemIds = ref<Set<string>>(new Set());

let learningItemSubscription: { unsubscribe: () => void } | null = null;
let flashcardSubscription: { unsubscribe: () => void } | null = null;
let verbatimSubscription: { unsubscribe: () => void } | null = null;
let collectionSubscription: { unsubscribe: () => void } | null = null;

watch(
  () => route.params.id,
  (value) => {
    const idParam = Array.isArray(value) ? value[0] : value;
    collectionId.value = idParam ?? null;
    expandedItemIds.value = new Set();
    collection.value = null;
    learningItems.value = [];
    isLoadingCollection.value = true;
    isLoadingItems.value = true;
    void loadCollection();
  },
  { immediate: true },
);

onMounted(() => {
  learningItemSubscription = learningItemRepository.watchAll().subscribe({
    next(value) {
      if (!collectionId.value) {
        learningItems.value = [];
      } else {
        learningItems.value = value
          .filter((item) => item.collectionId === collectionId.value)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      isLoadingItems.value = false;
    },
    error(error) {
      reportError('Failed to load learning items', error);
      isLoadingItems.value = false;
    },
  });

  flashcardSubscription = flashcardRepository.watchAll().subscribe({
    next(value) {
      rawFlashcards.value = value;
      flashcardsReady.value = true;
    },
    error(error) {
      reportError('Failed to load flashcards', error);
      flashcardsReady.value = true;
    },
  });

  verbatimSubscription = verbatimRepository.watchAll().subscribe({
    next(value) {
      rawVerbatimItems.value = value;
      verbatimReady.value = true;
    },
    error(error) {
      reportError('Failed to load verbatim passages', error);
      verbatimReady.value = true;
    },
  });

  collectionSubscription = collectionRepository.watchAll().subscribe({
    next(value) {
      collectionOptions.value = value;
    },
    error(error) {
      reportError('Failed to load collections', error);
    },
  });
});

onBeforeUnmount(() => {
  learningItemSubscription?.unsubscribe();
  flashcardSubscription?.unsubscribe();
  verbatimSubscription?.unsubscribe();
  collectionSubscription?.unsubscribe();
});

const orderedItems = computed(() => [...learningItems.value]);

const availableCollections = computed(() =>
  [...collectionOptions.value].sort((a, b) => a.title.localeCompare(b.title)),
);

const flashcardsByItem = computed<Record<string, FlashcardRecord[]>>(() => {
  const grouped: Record<string, FlashcardRecord[]> = {};
  const itemIds = new Set(learningItems.value.map((item) => item.id));
  for (const card of rawFlashcards.value) {
    if (!itemIds.has(card.learningItemId)) {
      continue;
    }
    const list = grouped[card.learningItemId] ?? (grouped[card.learningItemId] = []);
    list.push(card);
  }
  for (const key of Object.keys(grouped)) {
    const source = grouped[key] ?? [];
    grouped[key] = source.slice().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  return grouped;
});

const verbatimByItem = computed<Record<string, VerbatimItemRecord[]>>(() => {
  const grouped: Record<string, VerbatimItemRecord[]> = {};
  const itemIds = new Set(learningItems.value.map((item) => item.id));
  for (const passage of rawVerbatimItems.value) {
    if (!itemIds.has(passage.learningItemId)) {
      continue;
    }
    const list = grouped[passage.learningItemId] ?? (grouped[passage.learningItemId] = []);
    list.push(passage);
  }
  for (const key of Object.keys(grouped)) {
    const source = grouped[key] ?? [];
    grouped[key] = source.slice().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  return grouped;
});

const learningItemModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  isSaving: false,
  targetId: null as string | null,
  form: {
    name: '',
    description: '',
    collectionId: '',
  },
});

const flashcardModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  isSaving: false,
  targetId: null as string | null,
  learningItemId: null as string | null,
  learningItemName: null as string | null,
  form: {
    front: '',
    back: '',
  },
});

const verbatimModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  isSaving: false,
  targetId: null as string | null,
  learningItemId: null as string | null,
  learningItemName: null as string | null,
  form: {
    preExercise: '',
    toMemorize: '',
    postExercise: '',
  },
});

async function loadCollection() {
  if (!collectionId.value) {
    await router.replace('/collections/list');
    return;
  }

  try {
    const record = await collectionRepository.get(collectionId.value);
    if (!record) {
      await router.replace('/collections/list');
      return;
    }
    collection.value = record;
  } catch (error) {
    reportError('Failed to load collection', error);
  } finally {
    isLoadingCollection.value = false;
  }
}

function toggleExpanded(id: string) {
  if (expandedItemIds.value.has(id)) {
    expandedItemIds.value.delete(id);
  } else {
    expandedItemIds.value.add(id);
  }
  expandedItemIds.value = new Set(expandedItemIds.value);
}

function openLearningItemModal(mode: 'create' | 'edit', item?: LearningItemRecord) {
  learningItemModal.mode = mode;
  learningItemModal.open = true;
  learningItemModal.isSaving = false;

  if (mode === 'edit' && item) {
    learningItemModal.targetId = item.id;
    learningItemModal.form.name = item.name;
    learningItemModal.form.description = item.description;
    learningItemModal.form.collectionId = item.collectionId ?? '';
  } else {
    learningItemModal.targetId = null;
    learningItemModal.form.name = '';
    learningItemModal.form.description = '';
    learningItemModal.form.collectionId = collectionId.value ?? '';
  }
}

function closeLearningItemModal() {
  if (learningItemModal.isSaving) {
    return;
  }
  learningItemModal.open = false;
  learningItemModal.targetId = null;
  learningItemModal.mode = 'create';
  learningItemModal.form.name = '';
  learningItemModal.form.description = '';
  learningItemModal.form.collectionId = collectionId.value ?? '';
}

async function submitLearningItem() {
  if (learningItemModal.isSaving || !learningItemModal.form.name.trim()) {
    return;
  }
  learningItemModal.isSaving = true;
  let success = false;
  try {
    const payload = {
      name: learningItemModal.form.name,
      description: learningItemModal.form.description,
      collectionId: learningItemModal.form.collectionId
        ? learningItemModal.form.collectionId
        : null,
    };
    if (learningItemModal.mode === 'edit' && learningItemModal.targetId) {
      await learningItemRepository.update(learningItemModal.targetId, payload);
    } else {
      const newId = await learningItemRepository.create(payload);
      expandedItemIds.value.add(newId);
      expandedItemIds.value = new Set(expandedItemIds.value);
    }
    success = true;
  } catch (error) {
    reportError('Failed to save learning item', error);
  } finally {
    learningItemModal.isSaving = false;
  }
  if (success) {
    closeLearningItemModal();
  }
}

function openFlashcardModal(
  mode: 'create' | 'edit',
  fallbackLearningItemId: string,
  card?: FlashcardRecord,
) {
  const learningItemId = card?.learningItemId ?? fallbackLearningItemId;
  flashcardModal.mode = mode;
  flashcardModal.open = true;
  flashcardModal.isSaving = false;
  flashcardModal.learningItemId = learningItemId;
  flashcardModal.learningItemName = getLearningItemName(learningItemId);

  if (mode === 'edit' && card) {
    flashcardModal.targetId = card.id;
    flashcardModal.form.front = card.front;
    flashcardModal.form.back = card.back;
  } else {
    flashcardModal.targetId = null;
    flashcardModal.form.front = '';
    flashcardModal.form.back = '';
  }
}

function closeFlashcardModal() {
  if (flashcardModal.isSaving) {
    return;
  }
  flashcardModal.open = false;
  flashcardModal.targetId = null;
  flashcardModal.learningItemId = null;
  flashcardModal.learningItemName = null;
  flashcardModal.mode = 'create';
  flashcardModal.form.front = '';
  flashcardModal.form.back = '';
}

async function submitFlashcard() {
  if (
    flashcardModal.isSaving ||
    !flashcardModal.learningItemId ||
    !flashcardModal.form.front.trim() ||
    !flashcardModal.form.back.trim()
  ) {
    return;
  }
  flashcardModal.isSaving = true;
  let success = false;
  try {
    if (flashcardModal.mode === 'edit' && flashcardModal.targetId) {
      await flashcardRepository.update(flashcardModal.targetId, {
        front: flashcardModal.form.front,
        back: flashcardModal.form.back,
        learningItemId: flashcardModal.learningItemId,
      });
    } else {
      await flashcardRepository.create({
        front: flashcardModal.form.front,
        back: flashcardModal.form.back,
        learningItemId: flashcardModal.learningItemId,
      });
    }
    success = true;
  } catch (error) {
    reportError('Failed to save flashcard', error);
  } finally {
    flashcardModal.isSaving = false;
  }
  if (success) {
    closeFlashcardModal();
  }
}

function openVerbatimModal(
  mode: 'create' | 'edit',
  fallbackLearningItemId: string,
  passage?: VerbatimItemRecord,
) {
  const learningItemId = passage?.learningItemId ?? fallbackLearningItemId;
  verbatimModal.mode = mode;
  verbatimModal.open = true;
  verbatimModal.isSaving = false;
  verbatimModal.learningItemId = learningItemId;
  verbatimModal.learningItemName = getLearningItemName(learningItemId);

  if (mode === 'edit' && passage) {
    verbatimModal.targetId = passage.id;
    verbatimModal.form.preExercise = passage.preExercise;
    verbatimModal.form.toMemorize = passage.toMemorize;
    verbatimModal.form.postExercise = passage.postExercise;
  } else {
    verbatimModal.targetId = null;
    verbatimModal.form.preExercise = '';
    verbatimModal.form.toMemorize = '';
    verbatimModal.form.postExercise = '';
  }
}

function closeVerbatimModal() {
  if (verbatimModal.isSaving) {
    return;
  }
  verbatimModal.open = false;
  verbatimModal.targetId = null;
  verbatimModal.learningItemId = null;
  verbatimModal.learningItemName = null;
  verbatimModal.mode = 'create';
  verbatimModal.form.preExercise = '';
  verbatimModal.form.toMemorize = '';
  verbatimModal.form.postExercise = '';
}

async function submitVerbatim() {
  if (
    verbatimModal.isSaving ||
    !verbatimModal.learningItemId ||
    !verbatimModal.form.toMemorize.trim()
  ) {
    return;
  }
  verbatimModal.isSaving = true;
  let success = false;
  try {
    if (verbatimModal.mode === 'edit' && verbatimModal.targetId) {
      await verbatimRepository.update(verbatimModal.targetId, {
        preExercise: verbatimModal.form.preExercise,
        toMemorize: verbatimModal.form.toMemorize,
        postExercise: verbatimModal.form.postExercise,
        learningItemId: verbatimModal.learningItemId,
      });
    } else {
      await verbatimRepository.create({
        preExercise: verbatimModal.form.preExercise,
        toMemorize: verbatimModal.form.toMemorize,
        postExercise: verbatimModal.form.postExercise,
        learningItemId: verbatimModal.learningItemId,
      });
    }
    success = true;
  } catch (error) {
    reportError('Failed to save verbatim passage', error);
  } finally {
    verbatimModal.isSaving = false;
  }
  if (success) {
    closeVerbatimModal();
  }
}

async function confirmLearningItemDelete(record: LearningItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this learning item?') : true;
  if (!shouldDelete) {
    return;
  }
  try {
    const relatedFlashcards = flashcardsByItem.value[record.id] ?? [];
    const relatedPassages = verbatimByItem.value[record.id] ?? [];
    await Promise.all([
      ...relatedFlashcards.map((card) => flashcardRepository.remove(card.id)),
      ...relatedPassages.map((passage) => verbatimRepository.remove(passage.id)),
    ]);
    await learningItemRepository.remove(record.id);
    expandedItemIds.value.delete(record.id);
    expandedItemIds.value = new Set(expandedItemIds.value);
  } catch (error) {
    reportError('Failed to delete learning item', error);
  }
}

async function confirmFlashcardDelete(record: FlashcardRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this flashcard?') : true;
  if (!shouldDelete) {
    return;
  }
  try {
    await flashcardRepository.remove(record.id);
  } catch (error) {
    reportError('Failed to delete flashcard', error);
  }
}

async function confirmVerbatimDelete(record: VerbatimItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this passage?') : true;
  if (!shouldDelete) {
    return;
  }
  try {
    await verbatimRepository.remove(record.id);
  } catch (error) {
    reportError('Failed to delete verbatim passage', error);
  }
}

function getLearningItemName(learningItemId: string): string {
  const record = learningItems.value.find((item) => item.id === learningItemId);
  return record?.name ?? 'Learning item';
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
