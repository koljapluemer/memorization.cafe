<template>
  <dialog
    ref="dialogRef"
    class="modal"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg">
        Share Collection
      </h3>

      <!-- Step 1: Enter author name -->
      <div
        v-if="!shareUrl"
        class="py-4"
      >
        <p class="mb-4">
          Share this collection publicly. Anyone with the link will be able to view and download it.
        </p>

        <fieldset class="fieldset">
          <label
            for="author-name"
            class="label"
          >
            Author Name
          </label>
          <input
            id="author-name"
            v-model="authorName"
            type="text"
            class="input"
            placeholder="Your name"
          >
        </fieldset>
      </div>

      <!-- Step 2: Show shareable link -->
      <div
        v-else
        class="py-4 space-y-4"
      >
        <p>Your collection has been shared! Anyone with this link can view and download it.</p>

        <fieldset class="fieldset">
          <label
            for="share-link"
            class="label"
          >
            Share Link
          </label>
          <div class="flex gap-2">
            <input
              id="share-link"
              ref="linkInputRef"
              :value="shareUrl"
              readonly
              type="text"
              class="input flex-1"
            >
            <button
              class="btn"
              @click="copyLink"
            >
              <Copy :size="16" /> Copy
            </button>
          </div>
        </fieldset>

        <div
          v-if="copySuccess"
          class="text-success text-sm"
        >
          Link copied to clipboard!
        </div>
      </div>

      <div
        v-if="error"
        class="alert alert-error mt-4"
      >
        {{ error }}
      </div>

      <div class="modal-action">
        <button
          v-if="!shareUrl"
          class="btn btn-primary"
          :disabled="isSharing || !authorName.trim()"
          @click="handleShare"
        >
          {{ isSharing ? 'Sharing...' : 'Share Collection' }}
        </button>
        <button
          class="btn"
          @click="close"
        >
          {{ shareUrl ? 'Done' : 'Cancel' }}
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Copy } from 'lucide-vue-next';

import { shareCollection } from './share-service';

import { useCloudSync } from '@/app/useCloudSync';

const props = defineProps<{
  collectionId: string;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const linkInputRef = ref<HTMLInputElement | null>(null);
const authorName = ref('');
const shareUrl = ref('');
const isSharing = ref(false);
const error = ref<string | null>(null);
const copySuccess = ref(false);

const { currentUser } = useCloudSync();

function open() {
  // Reset state
  shareUrl.value = '';
  error.value = null;
  copySuccess.value = false;

  // Pre-fill author name with user's email if available
  authorName.value = currentUser.value?.email || currentUser.value?.name || '';

  dialogRef.value?.showModal();
}

function close() {
  dialogRef.value?.close();
}

async function handleShare() {
  isSharing.value = true;
  error.value = null;

  try {
    const result = await shareCollection(props.collectionId, authorName.value);
    shareUrl.value = result.shareUrl;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to share collection';
  } finally {
    isSharing.value = false;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 3000);
  } catch {
    // Fallback: select the text
    linkInputRef.value?.select();
  }
}

defineExpose({
  open,
  close,
});
</script>
