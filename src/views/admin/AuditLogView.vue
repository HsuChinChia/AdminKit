<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <ClipboardList class="w-8 h-8 text-primary-500" />
          稽核日誌
        </h1>
        <p class="text-slate-500 font-medium mt-1">所有重要資料操作的完整記錄</p>
      </div>
      <button @click="fetchLogs" class="btn-ghost p-2.5 rounded-xl hover:rotate-180 transition-transform duration-500" title="重新整理">
        <RefreshCw class="w-5 h-5 text-slate-400" />
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="card card-body">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Action Filter -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">操作類型</span>
          <div class="flex gap-1.5">
            <button
              v-for="opt in actionOptions"
              :key="opt.value"
              @click="filterAction = filterAction === opt.value ? '' : opt.value"
              :class="['text-xs font-bold px-3 py-1.5 rounded-full transition-all', filterAction === opt.value ? opt.activeClass : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700']"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        <!-- Table Filter -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">資料表</span>
          <select v-model="filterTable" class="input text-xs py-1.5 px-3 rounded-lg h-auto">
            <option value="">全部</option>
            <option v-for="t in tableOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="ml-auto">
          <span class="text-xs text-slate-400 font-medium">共 {{ filteredLogs.length }} 筆記錄</span>
        </div>
      </div>
    </div>

    <!-- Log Table -->
    <div class="card overflow-hidden">
      <div v-if="loading" class="p-12 flex items-center justify-center flex-col gap-4">
        <Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
        <p class="text-sm font-medium text-slate-400">載入稽核日誌中...</p>
      </div>

      <div v-else-if="filteredLogs.length === 0" class="p-12 text-center">
        <ClipboardList class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-slate-400 font-medium">暫無符合條件的日誌記錄</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th v-for="h in headers" :key="h" class="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr
              v-for="log in paginatedLogs"
              :key="log.id"
              class="group hover:bg-primary-500/3 dark:hover:bg-primary-500/5 transition-colors cursor-pointer"
              @click="showDetail(log)"
            >
              <!-- 時間 -->
              <td class="px-5 py-4">
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {{ formatDate(log.created_at) }}
                </p>
                <p class="text-[11px] text-slate-400 font-medium">
                  {{ formatTime(log.created_at) }}
                </p>
              </td>

              <!-- 操作類型 -->
              <td class="px-5 py-4">
                <span :class="actionBadge(log.action)">{{ actionLabel(log.action) }}</span>
              </td>

              <!-- 資料表 -->
              <td class="px-5 py-4">
                <span class="text-sm font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300">
                  {{ log.table_name }}
                </span>
              </td>

              <!-- 記錄 ID -->
              <td class="px-5 py-4">
                <span class="text-xs text-slate-400 font-mono truncate max-w-[120px] block" :title="log.record_id">
                  {{ log.record_id?.slice(0, 8) }}...
                </span>
              </td>

              <!-- 操作者 -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {{ getUserInitial(log) }}
                  </div>
                  <span class="text-sm font-medium text-slate-600 dark:text-slate-300">{{ getUserName(log) }}</span>
                </div>
              </td>

              <!-- 快速預覽 -->
              <td class="px-5 py-4">
                <button class="text-xs text-primary-500 hover:text-primary-400 font-bold transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <Eye class="w-3.5 h-3.5" /> 查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredLogs.length > pageSize" class="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-400 font-medium">第 {{ currentPage }} / {{ totalPages }} 頁</span>
        <div class="flex gap-2">
          <button @click="currentPage--" :disabled="currentPage <= 1" class="btn-ghost px-3 py-1.5 text-xs rounded-lg disabled:opacity-30">← 上一頁</button>
          <button @click="currentPage++" :disabled="currentPage >= totalPages" class="btn-ghost px-3 py-1.5 text-xs rounded-lg disabled:opacity-30">下一頁 →</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Transition name="fade">
      <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="selectedLog = null">
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
          <div class="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <span :class="actionBadge(selectedLog.action)">{{ actionLabel(selectedLog.action) }}</span>
              <code class="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{{ selectedLog.table_name }}</code>
            </div>
            <button @click="selectedLog = null" class="btn-ghost p-2 rounded-xl"><X class="w-5 h-5" /></button>
          </div>
          <div class="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div class="flex items-center gap-3 text-sm text-slate-500">
              <Clock class="w-4 h-4" />
              {{ new Date(selectedLog.created_at).toLocaleString('zh-TW') }}
              <span>・</span>
              <UserIcon class="w-4 h-4" />
              {{ getUserName(selectedLog) }}
            </div>

            <div v-if="selectedLog.old_data" class="space-y-2">
              <p class="text-xs font-black text-red-500 uppercase tracking-widest">操作前資料</p>
              <pre class="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{{ JSON.stringify(selectedLog.old_data, null, 2) }}</pre>
            </div>

            <div v-if="selectedLog.new_data" class="space-y-2">
              <p class="text-xs font-black text-emerald-500 uppercase tracking-widest">操作後資料</p>
              <pre class="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{{ JSON.stringify(selectedLog.new_data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { ClipboardList, RefreshCw, Loader2, Eye, X, Clock, User as UserIcon } from 'lucide-vue-next'

const auth = useAuthStore()
const notify = useNotificationStore()

interface AuditLog {
  id: number
  table_name: string
  action: string
  record_id: string | null
  old_data: any
  new_data: any
  user_id: string | null
  created_at: string
  user?: { username: string | null; email?: string | null }
}

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const filterAction = ref('')
const filterTable = ref('')
const currentPage = ref(1)
const pageSize = 25
const selectedLog = ref<AuditLog | null>(null)

const headers = ['時間', '操作類型', '資料表', '記錄 ID', '操作者', '']

const actionOptions = [
  { value: 'INSERT', label: '新增', activeClass: 'bg-emerald-500 text-white' },
  { value: 'UPDATE', label: '修改', activeClass: 'bg-amber-500 text-white' },
  { value: 'DELETE', label: '刪除', activeClass: 'bg-red-500 text-white' },
]

const tableOptions = computed(() => [...new Set(logs.value.map(l => l.table_name))].sort())

const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    if (filterAction.value && l.action !== filterAction.value) return false
    if (filterTable.value && l.table_name !== filterTable.value) return false
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

async function fetchLogs() {
  loading.value = true
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`*, user:profiles(username)`)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    notify.error('無法載入稽核日誌', error.message)
  } else {
    logs.value = data ?? []
  }
  loading.value = false
}

function showDetail(log: AuditLog) {
  selectedLog.value = log
}

function actionLabel(action: string) {
  return { INSERT: '新增', UPDATE: '修改', DELETE: '刪除' }[action] ?? action
}

function actionBadge(action: string) {
  const map: Record<string, string> = {
    INSERT: 'badge badge-success',
    UPDATE: 'badge badge-warning',
    DELETE: 'badge badge-danger',
  }
  return map[action] ?? 'badge badge-default'
}

function getUserName(log: AuditLog) {
  return (log as any).user?.username ?? log.user_id?.slice(0, 8) ?? '系統'
}

function getUserInitial(log: AuditLog) {
  const name = getUserName(log)
  return name.charAt(0).toUpperCase()
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('zh-TW')
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(() => {
  if (auth.hasPermission('audit:view') || auth.isAdmin) {
    fetchLogs()
  } else {
    notify.error('您沒有查閱稽核日誌的權限')
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
