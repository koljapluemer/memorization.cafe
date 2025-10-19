<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label
        for="name"
        class="label"
      >
        <span class="label-text">Name</span>
      </label>
      <input
        id="name"
        v-model="localName"
        type="text"
        placeholder="List name (markdown supported)"
        class="input input-bordered w-full"
      >
    </div>

    <div class="form-control w-full">
      <label class="label cursor-pointer">
        <span class="label-text">Ordered List</span>
        <input
          v-model="localIsOrderedList"
          type="checkbox"
          class="toggle"
          @change="handleOrderedToggle"
        >
      </label>
    </div>

    <div class="form-control w-full">
      <label
        for="note"
        class="label"
      >
        <span class="label-text">Note (optional)</span>
      </label>
      <textarea
        id="note"
        v-model="localNote"
        placeholder="Additional notes (markdown supported)"
        class="textarea textarea-bordered w-full h-24"
      />
    </div>

    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Items</span>
      </label>
      <div class="space-y-2">
        <div
          v-for="(_item, index) in localItems"
          :key="index"
          class="flex gap-2 items-center"
        >
          <span
            v-if="localIsOrderedList"
            class="text-sm font-semibold w-8"
          >{{ index + 1 }})</span>
          <input
            v-model="localItems[index]"
            type="text"
            :placeholder="`Item ${index + 1}`"
            class="input input-bordered flex-1"
            @input="handleItemChange"
          >
          <div
            v-if="localIsOrderedList"
            class="flex gap-1"
          >
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="index === 0"
              @click="moveItemUp(index)"
            >
              <span class="text-lg">↑</span>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :disabled="index === localItems.length - 1"
              @click="moveItemDown(index)"
            >
              <span class="text-lg">↓</span>
            </button>
          </div>
          <button
            v-if="localItems.length > 1 && index < localItems.length - 1"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="removeItem(index)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import type { List } from '@/app/database';
import { shuffleArray } from '@/dumb/array-utils';

const props = defineProps<{
  list?: List;
}>();

const emit = defineEmits<{
  update: [data: { name: string; items: string[]; isOrderedList: boolean; note?: string }];
}>();

const localName = ref(props.list?.name || '');
const localItems = ref<string[]>([...(props.list?.items || []), '']);
const localIsOrderedList = ref(props.list?.isOrderedList ?? false);
const localNote = ref(props.list?.note || '');

function handleItemChange() {
  // Always ensure there's one empty item at the end
  const nonEmptyItems = localItems.value.filter((item) => item.trim() !== '');
  localItems.value = [...nonEmptyItems, ''];
  emitUpdate();
}

function removeItem(index: number) {
  localItems.value.splice(index, 1);
  emitUpdate();
}

function moveItemUp(index: number) {
  if (index > 0) {
    [localItems.value[index], localItems.value[index - 1]] = [
      localItems.value[index - 1]!,
      localItems.value[index]!,
    ];
    emitUpdate();
  }
}

function moveItemDown(index: number) {
  if (index < localItems.value.length - 1) {
    [localItems.value[index], localItems.value[index + 1]] = [
      localItems.value[index + 1]!,
      localItems.value[index]!,
    ];
    emitUpdate();
  }
}

function handleOrderedToggle() {
  if (!localIsOrderedList.value) {
    // Switching from ordered to unordered: randomize
    const nonEmptyItems = localItems.value.filter((item) => item.trim() !== '');
    const shuffled = shuffleArray(nonEmptyItems);
    localItems.value = [...shuffled, ''];
  }
  emitUpdate();
}

function emitUpdate() {
  const nonEmptyItems = localItems.value.filter((item) => item.trim() !== '');
  emit('update', {
    name: localName.value,
    items: nonEmptyItems,
    isOrderedList: localIsOrderedList.value,
    note: localNote.value || undefined,
  });
}

watch([localName, localIsOrderedList, localNote], () => {
  emitUpdate();
});
</script>
