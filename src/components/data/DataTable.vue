<template>
  <div class="card overflow-hidden">
    <div class="card-header flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="search" type="text" :placeholder="searchPlaceholder" class="input pl-9" @input="onSearchInput" />
      </div>
      <slot name="actions" />
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-border dark:border-surface-dark-border bg-slate-50 dark:bg-slate-800/50">
            <th v-for="col in columns" :key="col.key"
              class="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
              :class="col.sortable !== false ? 'cursor-pointer select-none hover:text-primary-600 transition' : ''"
              @click="col.sortable !== false && toggleSort(col.key)">
              <div class="flex items-center gap-1">
                {{ col.label }}
                <ChevronUp    v-if="sortCol === col.key && sortAsc"  class="w-3 h-3 text-primary-500" />
                <ChevronDown  v-else-if="sortCol === col.key"        class="w-3 h-3 text-primary-500" />
                <ChevronsUpDown v-else-if="col.sortable !== false"   class="w-3 h-3 text-slate-300" />
              </div>
            </th>
            <th v-if="$slots.rowActions" class="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + ($slots.rowActions ? 1 : 0)" class="px-4 py-12 text-center">
              <div class="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 class="w-5 h-5 animate-spin" /><span>載入中...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + ($slots.rowActions ? 1 : 0)" class="px-4 py-12 text-center">
              <div class="flex flex-col items-center gap-2 text-slate-400">
                <Inbox class="w-10 h-10" /><span>{{ emptyText }}</span>
              </div>
            </td>
          </tr>
          <tr v-else v-for="(row, idx) in rows" :key="(row as any).id ?? idx"
            class="border-b border-surface-border dark:border-surface-dark-border hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-slate-700 dark:text-slate-200">
              <slot :name="`cell-${col.key}`" :row="row" :value="getCellValue(row, col.key)">
                {{ col.format ? col.format(getCellValue(row, col.key), row) : getCellValue(row, col.key) }}
              </slot>
            </td>
            <td v-if="$slots.rowActions" class="px-4 py-3 text-right">
              <slot name="rowActions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁 -->
    <div v-if="paginate && totalPages > 1" class="card-header flex items-center justify-between gap-4 flex-wrap">
      <p class="text-sm text-slate-500">共 <span class="font-semibold text-slate-700 dark:text-slate-200">{{ total }}</span> 筆，第 {{ currentPage }}/{{ totalPages }} 頁</p>
      <div class="flex items-center gap-1">
        <button @click="$emit('page-change', currentPage - 1)" :disabled="currentPage <= 1" class="btn-ghost btn-sm disabled:opacity-40"><ChevronLeft class="w-4 h-4" /></button>
        <button v-for="p in pageNumbers" :key="p" @click="$emit('page-change', p)"
          :class="p === currentPage ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'">{{ p }}</button>
        <button @click="$emit('page-change', currentPage + 1)" :disabled="currentPage >= totalPages" class="btn-ghost btn-sm disabled:opacity-40"><ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-vue-next'

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
