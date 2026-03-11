<template>
  <!-- Skeleton variants controlled by `type` prop -->

  <!-- Text line(s) -->
  <div v-if="type === 'text'" :class="['skeleton rounded', heightClass, widthClass]"></div>

  <!-- Avatar circle -->
  <div v-else-if="type === 'avatar'" :class="['skeleton rounded-full shrink-0', sizeClass]"></div>

  <!-- Card block -->
  <div v-else-if="type === 'card'" :class="['skeleton rounded-2xl', heightClass, widthClass]"></div>

  <!-- KPI Card skeleton -->
  <div v-else-if="type === 'kpi'" class="card-premium card-body flex items-center gap-5">
    <div class="skeleton w-14 h-14 rounded-2xl shrink-0"></div>
    <div class="flex-1 space-y-2.5">
      <div class="skeleton h-2.5 w-20 rounded-full"></div>
      <div class="skeleton h-7 w-28 rounded-lg"></div>
      <div class="skeleton h-2 w-16 rounded-full"></div>
    </div>
  </div>

  <!-- Table row skeleton -->
  <div v-else-if="type === 'table-row'" class="flex items-center gap-4 px-5 py-4 border-b border-slate-50 dark:border-slate-800">
    <div class="skeleton h-3.5 rounded-full" :style="{ width: '10%' }"></div>
    <div class="skeleton h-3.5 rounded-full" :style="{ width: '20%' }"></div>
    <div class="skeleton h-3.5 rounded-full" :style="{ width: '15%' }"></div>
    <div class="skeleton h-3.5 rounded-full" :style="{ width: '25%' }"></div>
    <div class="skeleton h-3.5 rounded-full" :style="{ width: '10%' }"></div>
    <div class="skeleton h-5 w-16 rounded-full"></div>
  </div>

  <!-- Default: shimmer block -->
  <div v-else :class="['skeleton rounded-xl', heightClass, widthClass]"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  type?: 'text' | 'avatar' | 'card' | 'kpi' | 'table-row'
  width?: string
  height?: string
  size?: string
}>(), {
  type: 'text',
  width: 'w-full',
  height: 'h-4',
  size: 'w-10 h-10',
})

const widthClass  = computed(() => props.width)
const heightClass = computed(() => props.height)
const sizeClass   = computed(() => props.size)
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.1) 25%,
    rgba(148, 163, 184, 0.25) 37%,
    rgba(148, 163, 184, 0.1) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.dark .skeleton {
  background: linear-gradient(
    90deg,
    rgba(51, 65, 85, 0.6) 25%,
    rgba(71, 85, 105, 0.9) 37%,
    rgba(51, 65, 85, 0.6) 63%
  );
  background-size: 400% 100%;
}

@keyframes shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
</style>
