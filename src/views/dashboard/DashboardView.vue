<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">儀表板</h1>
        <p class="text-slate-500 font-medium mt-1">控制中心 · 數據即時統計中</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- 即時連線狀態標示 -->
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm animate-pulse-slow">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-bold tracking-widest uppercase">Live</span>
        </div>
        <span
          class="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full uppercase tracking-widest">
          最後更新: {{ currentTime }}
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
            <div
              :class="['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', kpi.bg]">
              <component :is="kpi.icon" :class="['w-7 h-7', kpi.color]" />
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ kpi.label
                }}</p>
              <p class="text-2xl font-black text-slate-800 dark:text-white mt-0.5 tracking-tight">{{ kpi.value }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <span
                  :class="['text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5', kpi.trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500']">
                  {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}%
                </span>
                <span class="text-[10px] text-slate-400 font-medium">較上週</span>
              </div>
            </div>
          </div>
          <!-- Decorative subtle gradient -->
          <div
            class="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-700">
          </div>
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
                <span
                  class="text-sm font-semibold text-slate-500 group-hover/item:text-slate-800 dark:group-hover/item:text-slate-200 transition-colors">{{
                    label }}</span>
              </div>
              <span
                class="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{{
                  orderValues[i] }}</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { DollarSign, Users, ShoppingCart, TrendingUp, Activity } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useWebsocket } from '@/composables/useWebsocket'
import { useNotificationStore } from '@/stores/notifications'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import TaskWidget from '@/components/crm/TaskWidget.vue'

const auth = useAuthStore()
const ui = useUiStore()
const notify = useNotificationStore()

// 處理時間顯示
const currentTime = ref(new Date().toLocaleTimeString())
let timeInterval: number

// Simulate KPI loading state (in a real app, this would be tied to a data fetch)
const kpiLoading = ref(true)

onMounted(() => {
  timeInterval = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

// --- Supabase Raw WebSocket 練習實作 ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 組成 Supabase 專用的 WS 網址
const wsUrl = `${supabaseUrl.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${supabaseAnonKey}&vsn=1.0.0`
const { isConnected, data: wsData, connect, send, disconnect: wsDisconnect } = useWebsocket(wsUrl)

let heartbeatInterval: number

// 核心邏輯：當連線成功時，必須手動發送「加入頻道」及「心跳」
watch(isConnected, (connected) => {
  if (connected) {
    console.log('📡 Supabase WS 已連線，正在加入頻道...')

    // 1. 加入頻道 (Join Channel) - 監聽 public schema 下的 activity 表
    send({
      topic: 'realtime:public:activity',
      event: 'phx_join',
      payload: { config: { postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'activity' }] } },
      ref: '1'
    })

    // 2. 設定心跳包 (Heartbeat) - 每 30 秒發送一次，否則 Supabase 會自動切斷
    heartbeatInterval = window.setInterval(() => {
      send({
        topic: 'phoenix',
        event: 'heartbeat',
        payload: {},
        ref: Date.now().toString()
      })
    }, 30000)
  } else {
    if (heartbeatInterval) clearInterval(heartbeatInterval)
  }
})

// 監聽來自 WebSocket 的原始資料變更
watch(wsData, (msg: any) => {
  if (!msg || msg.event !== 'postgres_changes') return

  const payload = msg.payload?.data?.record
  if (!payload) return

  // 解析 Supabase 傳回來的資料格式
  notify.info(`📡 WS 直連收到: ${payload.action || '新活動'}`, 'Supabase Realtime')

  // 更新最近活動
  recentActivity.value.unshift({
    id: `#${payload.id?.slice(0, 4) || Math.floor(Math.random() * 1000)}`,
    user: payload.user || '匿名用戶',
    action: payload.action || '未知動作',
    amount: parseFloat(payload.amount) || 0,
    status: '處理中',
    time: '剛剛'
  })
  if (recentActivity.value.length > 5) recentActivity.value.pop()

  // 同步更新 KPI
  if (kpiCards.value[0] && payload.amount) {
    const currentRevenue = parseInt(kpiCards.value[0].value.replace(/[^\d]/g, ''))
    kpiCards.value[0].value = `NT$ ${(currentRevenue + parseFloat(payload.amount)).toLocaleString()}`
  }
})

onUnmounted(() => {
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  wsDisconnect()
})

// 為了讓畫面看起來「很即時」，我們加上模擬的數據跳動
let simInterval: number
onMounted(() => {
  setTimeout(() => { kpiLoading.value = false }, 800)

  // 模擬即時訂單跟營收跳動
  simInterval = window.setInterval(() => {
    if (kpiCards.value.length > 0) {
      // 隨機增加營收
      const currentRevenue = parseInt(kpiCards.value[0].value.replace(/[^\d]/g, ''))
      kpiCards.value[0].value = `NT$ ${(currentRevenue + Math.floor(Math.random() * 1500)).toLocaleString()}`

      // 隨機變動完成率
      const currentRate = parseFloat(kpiCards.value[3].value)
      const newRate = (currentRate + (Math.random() * 0.4 - 0.2)).toFixed(1)
      if (parseFloat(newRate) <= 100 && parseFloat(newRate) >= 0) {
        kpiCards.value[3].value = `${newRate}%`
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (simInterval) clearInterval(simInterval)
})

const kpiCards = ref([
  { label: '今日營收', value: 'NT$ 38,240', trend: 12.5, icon: DollarSign, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: '新增會員', value: '128', trend: 8.3, icon: Users, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  { label: '待處理訂單', value: '24', trend: -3.2, icon: ShoppingCart, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  { label: '完成率', value: '94.2%', trend: 2.1, icon: TrendingUp, bg: 'bg-primary-100 dark:bg-primary-900/30', color: 'text-primary-600 dark:text-primary-400' },
]) as any

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

const recentActivity = ref([
  { id: '#2401', user: '王小明', action: '新增訂單', amount: 4200, status: '待確認', time: '3 分鐘前' },
  { id: '#2400', user: '李美玲', action: '完成付款', amount: 8900, status: '已完成', time: '15 分鐘前' },
  { id: '#2399', user: '張志豪', action: '申請退款', amount: 1500, status: '處理中', time: '1 小時前' },
  { id: '#2398', user: '陳雅惠', action: '完成付款', amount: 12300, status: '已完成', time: '2 小時前' },
])

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
