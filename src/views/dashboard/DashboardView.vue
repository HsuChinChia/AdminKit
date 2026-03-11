<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">儀表板</h1>
        <p class="text-slate-500 font-medium mt-1">控制中心 · 數據即時統計中</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full uppercase tracking-widest">
          最後更新: {{ new Date().toLocaleTimeString() }}
        </span>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <!-- Skeleton state -->
      <template v-if="kpiLoading">
        <div v-for="i in 4" :key="`kpi-sk-${i}`" class="card-premium card-body flex items-center gap-5">
          <div class="skeleton w-14 h-14 rounded-2xl shrink-0"></div>
          <div class="flex-1 space-y-2.5">
            <div class="skeleton h-2.5 w-20 rounded-full"></div>
            <div class="skeleton h-7 w-28 rounded-lg"></div>
            <div class="skeleton h-2 w-16 rounded-full"></div>
          </div>
        </div>
      </template>
      <!-- Loaded state -->
      <template v-else>
        <div v-for="(kpi, idx) in kpiCards" :key="kpi.label"
          class="card-premium group relative overflow-hidden animate-slide-up"
          :style="{ animationDelay: `${idx * 100}ms` }">
          <div class="card-body relative z-10 flex items-center gap-5">
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', kpi.bg]">
              <component :is="kpi.icon" :class="['w-7 h-7', kpi.color]" />
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ kpi.label }}</p>
              <p class="text-2xl font-black text-slate-800 dark:text-white mt-0.5 tracking-tight">{{ kpi.value }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <span :class="['text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5', kpi.trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500']">
                  {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}%
                </span>
                <span class="text-[10px] text-slate-400 font-medium">較上週</span>
              </div>
            </div>
          </div>
          <!-- Decorative subtle gradient -->
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-700"></div>
        </div>
      </template>
    </div>

    <!-- 圖表區與任務追蹤 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- 營收趨勢 (Line Chart) -->
      <div class="card lg:col-span-2 overflow-hidden animate-slide-up" style="animation-delay: 400ms">
        <div class="card-header items-end py-6">
          <div>
            <h2 class="font-bold text-lg text-slate-800 dark:text-white tracking-tight">營收趨勢</h2>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">最近 7 天即時流量</p>
          </div>
          <span class="badge badge-success">本週 +12.5%</span>
        </div>
        <div class="p-6 h-72">
          <LineChart :labels="revenueLabels" :datasets="revenueDatasets" />
        </div>
      </div>

      <!-- 設備訪問占比 (Bar Chart) - 新增 -->
      <div class="card overflow-hidden animate-slide-up" style="animation-delay: 500ms">
        <div class="card-header py-6">
          <div>
            <h2 class="font-bold text-lg text-slate-800 dark:text-white tracking-tight">設備來源</h2>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">本月不重複訪客統計</p>
          </div>
        </div>
        <div class="p-6 h-72">
          <BarChart :labels="deviceLabels" :datasets="deviceDatasets" />
        </div>
      </div>

      <!-- 訂單狀態 (Doughnut Chart) -->
      <div class="card overflow-hidden animate-slide-up" style="animation-delay: 600ms">
        <div class="card-header py-6">
          <div>
            <h2 class="font-bold text-lg text-slate-800 dark:text-white tracking-tight">訂單狀態</h2>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">本月訂單處理分布</p>
          </div>
        </div>
        <div class="p-6">
          <div class="h-48 mb-6">
            <DoughnutChart :labels="orderLabels" :datasets="orderDatasets" />
          </div>
          <div class="space-y-3">
            <div v-for="(label, i) in orderLabels" :key="label" class="flex items-center justify-between group/item">
              <div class="flex items-center gap-3">
                <div class="w-2.5 h-2.5 rounded-full shadow-sm" :style="{ background: orderColors[i] }" />
                <span class="text-sm font-semibold text-slate-500 group-hover/item:text-slate-800 dark:group-hover/item:text-slate-200 transition-colors">{{ label }}</span>
              </div>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{{ orderValues[i] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待辦事項 (Task Widget) - 放在第三欄 -->
      <div class="lg:col-span-1 h-[480px] animate-slide-up" style="animation-delay: 700ms">
        <TaskWidget />
      </div>
    </div>

    <!-- 最近活動 -->
    <div class="card overflow-hidden animate-slide-up" style="animation-delay: 800ms">
      <div class="card-header py-6">
        <div>
          <h2 class="font-bold text-lg text-slate-800 dark:text-white tracking-tight">最近活動</h2>
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">即時操作日誌</p>
        </div>
        <RouterLink v-if="auth.isAdmin" to="/admin/users"
          class="text-sm text-primary-600 dark:text-primary-400 hover:underline">查看全部 →</RouterLink>
      </div>
      <DataTable :columns="activityColumns" :rows="recentActivity" :paginate="false" empty-text="尚無活動記錄">
        <template #cell-status="{ value }">
          <span :class="statusBadge(String(value))">{{ value }}</span>
        </template>
        <template #cell-amount="{ value }">
          <span class="font-semibold text-slate-700 dark:text-slate-200">NT$ {{ Number(value).toLocaleString() }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRealtime } from '@/composables/useRealtime'
import { useNotificationStore } from '@/stores/notifications'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import TaskWidget from '@/components/crm/TaskWidget.vue'

const auth = useAuthStore()
const ui = useUiStore()
const notify = useNotificationStore()

// Simulate KPI loading state (in a real app, this would be tied to a data fetch)
const kpiLoading = ref(true)
onMounted(() => { setTimeout(() => { kpiLoading.value = false }, 800) })

// Realtime 示範：新用戶加入時通知
useRealtime('profiles', {
  onInsert: (row: any) => notify.success(`新用戶 ${row.username || row.id} 已加入！`, '🎉 新用戶'),
})

const kpiCards = [
  { label: '今日營收', value: 'NT$ 38,240', trend: 12.5, icon: DollarSign, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: '新增會員', value: '128', trend: 8.3, icon: Users, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  { label: '待處理訂單', value: '24', trend: -3.2, icon: ShoppingCart, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  { label: '完成率', value: '94.2%', trend: 2.1, icon: TrendingUp, bg: 'bg-primary-100 dark:bg-primary-900/30', color: 'text-primary-600 dark:text-primary-400' },
]

const revenueLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
const revenueDatasets = computed(() => [{
  label: '營收 (NT$)',
  data: [28000, 35000, 30000, 42000, 38000, 51000, 38240],
  borderColor: '#0ea5e9',
  backgroundColor: ui.theme === 'dark' ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.08)',
  fill: true, tension: 0.4,
  pointBackgroundColor: '#0ea5e9', pointRadius: 4,
}])

const deviceLabels = ['手機', '電腦', '平板', '其他']
const deviceDatasets = computed(() => [
  {
    label: '造訪次數',
    data: [12500, 8400, 3200, 900],
    backgroundColor: '#8b5cf6', // Indigo/Violet
    borderRadius: 6
  }
])

const orderLabels = ['已完成', '處理中', '待確認', '已取消']
const orderColors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444']
const orderValues = [186, 42, 24, 8]
const orderDatasets = [{ data: orderValues, backgroundColor: orderColors, hoverOffset: 8, borderWidth: 2, borderColor: 'transparent' }]

const activityColumns = [
  { key: 'id', label: 'ID', sortable: false },
  { key: 'user', label: '用戶' },
  { key: 'action', label: '動作' },
  { key: 'amount', label: '金額' },
  { key: 'status', label: '狀態' },
  { key: 'time', label: '時間' },
]

const recentActivity = [
  { id: '#2401', user: '王小明', action: '新增訂單', amount: 4200, status: '待確認', time: '3 分鐘前' },
  { id: '#2400', user: '李美玲', action: '完成付款', amount: 8900, status: '已完成', time: '15 分鐘前' },
  { id: '#2399', user: '張志豪', action: '申請退款', amount: 1500, status: '處理中', time: '1 小時前' },
  { id: '#2398', user: '陳雅惠', action: '完成付款', amount: 12300, status: '已完成', time: '2 小時前' },
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    '已完成': 'badge badge-success',
    '處理中': 'badge badge-info',
    '待確認': 'badge badge-warning',
    '已取消': 'badge badge-danger',
  }
  return map[status] || 'badge badge-default'
}
</script>
