<script setup lang="ts">
const props = defineProps<{
  value: number   // 0–1
  color: string
  size?: number
  strokeWidth?: number
}>()

const size = computed(() => props.size ?? 48)
const stroke = computed(() => props.strokeWidth ?? 3)
const radius = computed(() => (size.value - stroke.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - Math.min(1, Math.max(0, props.value))))
</script>

<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
    <!-- Background track -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      stroke="#e4e4e7"
      :stroke-width="stroke"
    />
    <!-- Progress arc -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="color"
      :stroke-width="stroke"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      stroke-linecap="round"
      class="transition-all duration-500"
    />
  </svg>
</template>
