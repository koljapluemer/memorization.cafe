<template>
  <div class="page">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-h-[50vh]"
    >
      <div class="loading loading-spinner loading-lg" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="alert alert-error"
    >
      <p>{{ error }}</p>
      <a
        href="/"
        class="btn btn-sm"
      >
        Go Home
      </a>
    </div>

    <!-- Collection View -->
    <div
      v-else-if="collection"
      class="space-y-6"
    >
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold">
          {{ collection.collectionName }}
        </h1>
        <p
          v-if="collection.collectionDescription"
          class="text-light"
        >
          {{ collection.collectionDescription }}
        </p>

        <div class="flex items-center gap-4 text-sm text-light">
          <span>By {{ collection.authorName }}</span>
          <span>{{ formatDate(collection.createdAt) }}</span>
          <span>{{ collection.viewCount }} views</span>
          <span>{{ collection.downloadCount }} downloads</span>
        </div>
      </div>

      <!-- Download Button -->
      <div>
        <button
          class="btn btn-primary"
          :disabled="isDownloading"
          @click="handleDownload"
        >
          {{ isDownloading ? 'Downloading...' : 'Download to My Collections' }}
        </button>
      </div>

      <div
        v-if="downloadSuccess"
        class="alert alert-success"
      >
        <p>Collection downloaded successfully!</p>
        <router-link
          :to="`/manage/${newCollectionId}`"
          class="btn btn-sm"
        >
          View Collection
        </router-link>
      </div>

      <!-- Content Stats -->
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-title">
            Flashcards
          </div>
          <div class="stat-value text-primary">
            {{ collection.items.flashcards.length }}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">
            Concepts
          </div>
          <div class="stat-value text-secondary">
            {{ collection.items.concepts.length }}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">
            Lists
          </div>
          <div class="stat-value text-accent">
            {{ collection.items.lists.length }}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">
            Clozes
          </div>
          <div class="stat-value">
            {{ collection.items.clozes.length }}
          </div>
        </div>
      </div>

      <!-- Preview Items -->
      <div class="space-y-4">
        <!-- Flashcards Preview -->
        <div
          v-if="collection.items.flashcards.length > 0"
          class="space-y-2"
        >
          <h2 class="text-xl font-semibold">
            Flashcards ({{ collection.items.flashcards.length }})
          </h2>
          <div class="space-y-2">
            <div
              v-for="flashcard in collection.items.flashcards.slice(0, 5)"
              :key="flashcard.id"
              class="card bg-base-200"
            >
              <div class="card-body p-4">
                <div class="font-medium">
                  {{ flashcard.front }}
                </div>
                <div class="text-sm text-light">
                  {{ flashcard.back }}
                </div>
              </div>
            </div>
            <p
              v-if="collection.items.flashcards.length > 5"
              class="text-sm text-light"
            >
              And {{ collection.items.flashcards.length - 5 }} more...
            </p>
          </div>
        </div>

        <!-- Concepts Preview -->
        <div
          v-if="collection.items.concepts.length > 0"
          class="space-y-2"
        >
          <h2 class="text-xl font-semibold">
            Concepts ({{ collection.items.concepts.length }})
          </h2>
          <div class="space-y-2">
            <div
              v-for="concept in collection.items.concepts.slice(0, 5)"
              :key="concept.id"
              class="card bg-base-200"
            >
              <div class="card-body p-4">
                <div class="font-medium">
                  {{ concept.name }}
                </div>
              </div>
            </div>
            <p
              v-if="collection.items.concepts.length > 5"
              class="text-sm text-light"
            >
              And {{ collection.items.concepts.length - 5 }} more...
            </p>
          </div>
        </div>

        <!-- Lists Preview -->
        <div
          v-if="collection.items.lists.length > 0"
          class="space-y-2"
        >
          <h2 class="text-xl font-semibold">
            Lists ({{ collection.items.lists.length }})
          </h2>
          <div class="space-y-2">
            <div
              v-for="list in collection.items.lists.slice(0, 5)"
              :key="list.id"
              class="card bg-base-200"
            >
              <div class="card-body p-4">
                <div class="font-medium">
                  {{ list.name }}
                </div>
              </div>
            </div>
            <p
              v-if="collection.items.lists.length > 5"
              class="text-sm text-light"
            >
              And {{ collection.items.lists.length - 5 }} more...
            </p>
          </div>
        </div>

        <!-- Clozes Preview -->
        <div
          v-if="collection.items.clozes.length > 0"
          class="space-y-2"
        >
          <h2 class="text-xl font-semibold">
            Clozes ({{ collection.items.clozes.length }})
          </h2>
          <div class="space-y-2">
            <div
              v-for="cloze in collection.items.clozes.slice(0, 5)"
              :key="cloze.id"
              class="card bg-base-200"
            >
              <div class="card-body p-4">
                <div class="text-sm">
                  {{ cloze.content.slice(0, 100) }}{{ cloze.content.length > 100 ? '...' : '' }}
                </div>
              </div>
            </div>
            <p
              v-if="collection.items.clozes.length > 5"
              class="text-sm text-light"
            >
              And {{ collection.items.clozes.length - 5 }} more...
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { loadSharedCollection, incrementViewCount } from './collection-loader';
import { downloadCollection } from './collection-downloader';
import { incrementDownloadCount } from './collection-loader';
import type { SharedCollection } from '@/features/collection-sharing';

const route = useRoute();

const collection = ref<SharedCollection | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isDownloading = ref(false);
const downloadSuccess = ref(false);
const newCollectionId = ref<string | null>(null);

onMounted(async () => {
  const shareId = route.params.shareId as string;

  if (!shareId) {
    error.value = 'Invalid share link';
    isLoading.value = false;
    return;
  }

  try {
    collection.value = await loadSharedCollection(shareId);
    // Increment view count in background (don't await)
    incrementViewCount(shareId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load collection';
  } finally {
    isLoading.value = false;
  }
});

async function handleDownload() {
  if (!collection.value) return;

  isDownloading.value = true;
  downloadSuccess.value = false;

  try {
    newCollectionId.value = await downloadCollection(collection.value);
    downloadSuccess.value = true;

    // Increment download count in background
    const shareId = route.params.shareId as string;
    incrementDownloadCount(shareId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to download collection';
  } finally {
    isDownloading.value = false;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>
