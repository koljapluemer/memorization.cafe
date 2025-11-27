<template>
  <div class="form-control w-full">
    <label
      for="minimumInterval"
      class="label"
    >
      <span class="label-text">Minimum Interval (optional)</span>
      <span class="label-text-alt text-gray-500">Prevents showing too soon</span>
    </label>
    <select
      id="minimumInterval"
      :value="modelValue"
      class="select select-bordered w-full"
      @change="handleChange"
    >
      <option :value="undefined">
        None
      </option>
      <option value="HOUR">
        1 Hour
      </option>
      <option value="DAY">
        1 Day
      </option>
      <option value="TWO_DAYS">
        2 Days
      </option>
      <option value="WEEK">
        1 Week
      </option>
      <option value="MONTH">
        1 Month
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { Duration } from '@/dumb/Duration';

defineProps<{
  modelValue?: Duration;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Duration | undefined];
}>();

function handleChange(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) return;
  const value = target.value;
  emit('update:modelValue', value === 'undefined' || value === '' ? undefined : value as Duration);
}
</script>
