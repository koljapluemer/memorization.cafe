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
          class="btn btn-primary btn-lg"
          :disabled="isDownloading"
          @click="handleDownload"
        >
          {{ isDownloading ? 'Downloading...' : 'Start Practice' }}
        </button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { loadSharedCollection, incrementViewCount } from './collection-loader';
import { downloadCollection } from './collection-downloader';
import { incrementDownloadCount } from './collection-loader';

import type { SharedCollection } from '@/features/collection-sharing';

const route = useRoute();
const router = useRouter();

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

    // Redirect to practice page with filter for this collection
    router.push(`/practice?collection=${newCollectionId.value}`);
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
