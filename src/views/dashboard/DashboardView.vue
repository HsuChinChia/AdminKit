<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">儀表板</h1>
      <p class="text-slate-400 text-sm mt-1">歡迎回來，{{ auth.profile?.username || '用戶' }} 👋</p>
    </div>

    <!-- KPI 卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div v-for="kpi in kpiCards" :key="kpi.label"
        class="card card-body flex items-center gap-4 hover:shadow-md transition-shadow">
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0', kpi.bg]">
          <component :is="kpi.icon" :class="['w-6 h-6', kpi.color]" />
        </div>
        <div>
          <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">{{ kpi.label }}</p>
          <p class="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{{ kpi.value }}</p>
          <p :class="['text-xs mt-0.5 font-medium', kpi.trend > 0 ? 'text-emerald-500' : 'text-red-500']">
            {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}% 較上週
          </p>
        </div>
      </div>
    </div>

    <!-- 圖表區與任務追蹤 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- 營收趨勢 (Line Chart) -->
      <div class="card card-body lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="font-semibold text-slate-800 dark:text-white">營收趨勢</h2>
            <p class="text-xs text-slate-400 mt-0.5">最近 7 天</p>
          </div>
          <span class="badge badge-success">本週 +12.5%</span>
        </div>
        <div class="h-64">
          <LineChart :labels="revenueLabels" :datasets="revenueDatasets" />
        </div>
      </div>

      <!-- 設備訪問占比 (Bar Chart) - 新增 -->
      <div class="card card-body">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="font-semibold text-slate-800 dark:text-white">設備來源</h2>
            <p class="text-xs text-slate-400 mt-0.5">本月統計 (不重複訪客)</p>
          </div>
        </div>
        <div class="h-64">
          <BarChart :labels="deviceLabels" :datasets="deviceDatasets" />
        </div>
      </div>

      <!-- 訂單狀態 (Doughnut Chart) -->
      <div class="card card-body lg:col-span-2 xl:col-span-1">
        <div class="mb-6">
          <h2 class="font-semibold text-slate-800 dark:text-white">訂單狀態</h2>
          <p class="text-xs text-slate-400 mt-0.5">本月統計</p>
        </div>
        <div class="h-48">
          <DoughnutChart :labels="orderLabels" :datasets="orderDatasets" />
        </div>
        <div class="mt-4 space-y-2">
          <div v-for="(label, i) in orderLabels" :key="label" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" :style="{ background: orderColors[i] }" />
              <span class="text-slate-600 dark:text-slate-300">{{ label }}</span>
            </div>
            <span class="font-medium text-slate-700 dark:text-slate-200">{{ orderValues[i] }}</span>
          </div>
        </div>
      </div>

      <!-- 待辦事項 (Task Widget) - 放在第三欄 -->
      <div class="lg:col-span-1 h-[480px]">
        <TaskWidget />
      </div>
    </div>

    <!-- 最近活動 -->
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <h2 class="font-semibold text-slate-800 dark:text-white">最近活動</h2>
        <RouterLink v-if="auth.isAdmin" to="/admin/users" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">查看全部 →</RouterLink>
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
import { computed } from 'vue'
import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import { useRealtime }  from '@/composables/useRealtime'
import { useNotificationStore } from '@/stores/notifications'
import DataTable     from '@/components/data/DataTable.vue'
import LineChart     from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BarChart      from '@/components/charts/BarChart.vue'
import TaskWidget    from '@/components/crm/TaskWidget.vue'

const auth   = useAuthStore()
const ui     = useUiStore()
const notify = useNotificationStore()

// Realtime 示範：新用戶加入時通知
useRealtime('profiles', {
  onInsert: (row: any) => notify.success(`新用戶 ${row.username || row.id} 已加入！`, '🎉 新用戶'),
})

const kpiCards = [
  { label: '今日營收',   value: 'NT$ 38,240', trend: 12.5,  icon: DollarSign,   bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: '新增會員',   value: '128',         trend:  8.3,  icon: Users,        bg: 'bg-blue-100 dark:bg-blue-900/30',       color: 'text-blue-600 dark:text-blue-400' },
  { label: '待處理訂單', value: '24',          trend: -3.2,  icon: ShoppingCart, bg: 'bg-amber-100 dark:bg-amber-900/30',     color: 'text-amber-600 dark:text-amber-400' },
  { label: '完成率',     value: '94.2%',       trend:  2.1,  icon: TrendingUp,   bg: 'bg-primary-100 dark:bg-primary-900/30', color: 'text-primary-600 dark:text-primary-400' },
]

const revenueLabels   = ['週一','週二','週三','週四','週五','週六','週日']
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

const orderLabels   = ['已完成','處理中','待確認','已取消']
const orderColors   = ['#10b981','#0ea5e9','#f59e0b','#ef4444']
const orderValues   = [186, 42, 24, 8]
const orderDatasets = [{ data: orderValues, backgroundColor: orderColors, hoverOffset: 8, borderWidth: 2, borderColor: 'transparent' }]

const activityColumns = [
  { key: 'id',     label: 'ID',    sortable: false },
  { key: 'user',   label: '用戶' },
  { key: 'action', label: '動作' },
  { key: 'amount', label: '金額' },
  { key: 'status', label: '狀態' },
  { key: 'time',   label: '時間' },
]

const recentActivity = [
  { id: '#2401', user: '王小明', action: '新增訂單', amount: 4200,  status: '待確認', time: '3 分鐘前' },
  { id: '#2400', user: '李美玲', action: '完成付款', amount: 8900,  status: '已完成', time: '15 分鐘前' },
  { id: '#2399', user: '張志豪', action: '申請退款', amount: 1500,  status: '處理中', time: '1 小時前' },
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
