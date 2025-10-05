<template>
  <div class="space-y-8">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-3">
        <h1 class="text-2xl font-semibold">
          Welcome back
        </h1>
        <p class="text-base text-base-content/70">
          Pick a memorization flow below. Work through due reviews first to keep your knowledge fresh.
        </p>
      </div>
    </section>
    <section class="grid gap-6 md:grid-cols-2">
      <RouterLink
        to="/flashcards/list"
        class="card bg-base-100 shadow transition hover:-translate-y-0.5"
      >
        <div class="card-body space-y-3">
          <div class="flex items-center gap-3 text-lg font-semibold">
            <Layers class="h-5 w-5" />
            Flashcards
          </div>
          <p class="text-sm text-base-content/70">
            Create quick prompts and answers. Study them with FSRS-powered spacing.
          </p>
          <span class="btn btn-primary btn-sm w-fit">
            Go to flashcards
          </span>
        </div>
      </RouterLink>
      <RouterLink
        to="/verbatim/list"
        class="card bg-base-100 shadow transition hover:-translate-y-0.5"
      >
        <div class="card-body space-y-3">
          <div class="flex items-center gap-3 text-lg font-semibold">
            <FileText class="h-5 w-5" />
            Verbatim Memorization
          </div>
          <p class="text-sm text-base-content/70">
            Practice verbatim recall with cloze exercises before revealing the full text.
          </p>
          <span class="btn btn-primary btn-sm w-fit">
            Go to verbatim flow
          </span>
        </div>
      </RouterLink>
      <RouterLink
        to="/settings"
        class="card bg-base-100 shadow transition hover:-translate-y-0.5 md:col-span-2"
      >
        <div class="card-body space-y-3">
          <div class="flex items-center gap-3 text-lg font-semibold">
            <Settings class="h-5 w-5" />
            Sync & Settings
          </div>
          <p class="text-sm text-base-content/70">
            Configure Dexie Cloud sync to keep your progress across devices.
          </p>
          <span class="btn btn-primary btn-sm w-fit">
            Open settings
          </span>
        </div>
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { FileText, Layers, Settings } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
</script>
