<template>
  <div
    ref="root"
    class="prose max-w-none"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
});

interface Props {
  source: string;
}

const props = defineProps<Props>();

const root = ref<{ innerHTML: string } | null>(null);

async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) {
    return '';
  }
  const raw = marked.parse(markdown);
  const html = typeof raw === 'string' ? raw : await raw;
  return DOMPurify.sanitize(html);
}

async function updateContent(): Promise<void> {
  if (!root.value) {
    return;
  }
  const html = await renderMarkdown(props.source);
  root.value.innerHTML = html;
}

watch(
  () => props.source,
  () => {
    void updateContent();
  },
  { immediate: true },
);

onMounted(() => {
  void updateContent();
});
</script>
