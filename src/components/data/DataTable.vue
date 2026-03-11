<template>
  <div class="card overflow-hidden border-white/10 dark:border-white/5">
    <div class="card-header bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between py-6">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="search" type="text" :placeholder="searchPlaceholder" class="input pl-10 border-slate-200/60 dark:border-slate-700/50" @input="onSearchInput" />
      </div>
      <div class="flex items-center gap-3">
        <slot name="actions" />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-border dark:border-surface-dark-border bg-slate-50/80 dark:bg-slate-800/50">
            <th v-for="col in columns" :key="col.key"
              class="px-6 py-4 text-left font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] whitespace-nowrap"
              :class="col.sortable !== false ? 'cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400 transition-colors' : ''"
              @click="col.sortable !== false && toggleSort(col.key)">
              <div class="flex items-center gap-1.5">
                {{ col.label }}
                <div class="flex flex-col -gap-1 shrink-0" v-if="col.sortable !== false">
                  <ChevronUp class="w-2.5 h-2.5" :class="sortCol === col.key && sortAsc ? 'text-primary-600' : 'text-slate-300'" />
                  <ChevronDown class="w-2.5 h-2.5" :class="sortCol === col.key && !sortAsc ? 'text-primary-600' : 'text-slate-300'" />
                </div>
              </div>
            </th>
            <th v-if="$slots.rowActions" class="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
          <!-- Skeleton Loading Rows -->
          <tr v-if="loading" v-for="i in skeletonRows" :key="`sk-${i}`">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4">
              <div class="skeleton h-3.5 rounded-full" :style="{ width: skeletonWidths[i % skeletonWidths.length] }"></div>
            </td>
            <td v-if="$slots.rowActions" class="px-6 py-4">
              <div class="skeleton h-3.5 rounded-full w-16"></div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + ($slots.rowActions ? 1 : 0)" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center gap-4 text-slate-400">
                <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                  <Inbox class="w-8 h-8" />
                </div>
                <span class="font-medium">{{ emptyText }}</span>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(row, idx) in rows" :key="(row as any).id ?? idx"
            class="item-hover group">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
              <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)">
                {{ col.format ? col.format(getCellValue(row, col.key), row) : getCellValue(row, col.key) }}
              </slot>
            </td>
            <td v-if="$slots.rowActions" class="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div class="flex items-center justify-end gap-1">
                <slot name="rowActions" :row="row" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁 -->
    <div v-if="paginate && totalPages > 1" class="px-6 py-5 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between gap-4 flex-wrap border-t border-slate-100 dark:border-slate-800/50">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
        共 <span class="text-slate-700 dark:text-slate-200">{{ total }}</span> 筆紀錄
      </p>
      <div class="flex items-center gap-1.5">
        <button @click="$emit('page-change', currentPage - 1)" :disabled="currentPage <= 1" class="btn-ghost btn-sm px-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><ChevronLeft class="w-4 h-4" /></button>
        <button v-for="p in pageNumbers" :key="p" @click="$emit('page-change', p)"
          :class="p === currentPage ? 'btn-primary btn-sm px-3 scale-110 !rounded-lg' : 'btn-ghost btn-sm px-3 hover:scale-105'">{{ p }}</button>
        <button @click="$emit('page-change', currentPage + 1)" :disabled="currentPage >= totalPages" class="btn-ghost btn-sm px-2 text-slate-400 hover:text-primary-600 disabled:opacity-20"><ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-vue-next'

interface Column {
  key: string
  label: string
  sortable?: boolean
  format?: (value: any, row: any) => string
}

const props = withDefaults(defineProps<{
  columns: Column[]
  rows?: readonly any[] | any[]
  loading?: boolean
  paginate?: boolean
  total?: number
  currentPage?: number
  totalPages?: number
  searchPlaceholder?: string
  emptyText?: string
}>(), {
  rows: () => [],
  loading: false,
  paginate: true,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  searchPlaceholder: '搜尋...',
  emptyText: '目前沒有資料',
})

const emit = defineEmits<{
  (e: 'search', q: string): void
  (e: 'sort', payload: { col: string; asc: boolean }): void
  (e: 'page-change', page: number): void
}>()

const search  = ref('')
const sortCol = ref('')
const sortAsc = ref(false)
let searchTimer: ReturnType<typeof setTimeout>
const skeletonRows   = [1, 2, 3, 4, 5, 6, 7]
const skeletonWidths = ['60%', '40%', '75%', '50%', '65%', '35%', '55%']



function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('search', search.value), 400)
}

function toggleSort(col: string) {
  if (sortCol.value === col) sortAsc.value = !sortAsc.value
  else { sortCol.value = col; sortAsc.value = true }
  emit('sort', { col: sortCol.value, asc: sortAsc.value })
}

function getCellValue(row: any, key: string) {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

const pageNumbers = computed(() => {
  const pages: number[] = []
  const total = props.totalPages ?? 1
  const cur   = props.currentPage ?? 1
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i)
  return pages
})
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

@keyframes shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
</style>
