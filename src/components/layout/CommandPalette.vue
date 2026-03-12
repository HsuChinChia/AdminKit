<template>
  <Transition name="fade">
    <div v-if="ui.commandPaletteOpen" 
      class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      @keydown.esc="ui.commandPaletteOpen = false"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md" @click="ui.commandPaletteOpen = false"></div>

      <!-- Palette Container -->
      <div class="w-full max-w-2xl glass-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-scale-in">
        <!-- Search Input -->
        <div class="flex items-center p-4 border-b border-white/5">
          <Search class="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="搜尋功能、客戶或快速操作... (Esc 關閉)"
            class="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 text-lg"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter="selectCurrent"
          />
          <div class="flex items-center gap-1">
            <kbd class="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-400 font-sans">ESC</kbd>
          </div>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2 scrollbar-premium">
          <div v-if="filteredResults.length === 0" class="p-8 text-center">
            <p class="text-slate-400">找不到相關結果 "{{ query }}"</p>
          </div>

          <div v-else v-for="(group, gIdx) in groupedResults" :key="group.title" class="mb-4">
            <h3 class="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
            <div class="space-y-1">
              <button
                v-for="(item, iIdx) in group.items"
                :key="item.id"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                :class="isSelected(item.absoluteIndex) ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/50' : 'text-slate-400 hover:bg-white/5'"
                @click="executeItem(item)"
                @mouseenter="activeIndex = item.absoluteIndex"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <component :is="item.icon" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">{{ item.label }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ item.description }}</p>
                </div>
                <ChevronRight v-if="isSelected(item.absoluteIndex)" class="w-4 h-4 animate-bounce-x" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-white/5 bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-500">
          <div class="flex gap-4">
            <span><kbd class="px-1 bg-slate-800 rounded">↑↓</kbd> 選擇</span>
            <span><kbd class="px-1 bg-slate-800 rounded">Enter</kbd> 開啟</span>
          </div>
          <p>AdminKit Command Palette</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { 
  Search, User, LayoutDashboard, Building, Kanban, FileText, 
  LifeBuoy, Users, ShieldCheck, Settings, ClipboardList, ChevronRight 
} from 'lucide-vue-next'

const ui = useUiStore()
const router = useRouter()
const query = ref('')
const activeIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

// 靜態導航資料 (同步 Sidebar)
const navItems = [
  { id: 'profile',   label: '個人資料', description: '查看與編輯您的個人檔案', to: '/profile', icon: User, group: '導航' },
  { id: 'dashboard', label: '儀表板',   description: '查看數據分析與概況', to: '/dashboard', icon: LayoutDashboard, group: '導航' },
  { id: 'customers', label: '客戶管理', description: '管理客戶資訊與聯絡紀錄', to: '/crm/customers', icon: Building, group: 'CRM' },
  { id: 'deals',     label: '銷售漏斗', description: '追蹤銷售商機與進度', to: '/crm/deals', icon: Kanban, group: 'CRM' },
  { id: 'contracts', label: '合約與文件', description: '查閱與上傳客戶合約', to: '/crm/contracts', icon: FileText, group: 'CRM' },
  { id: 'tickets',   label: '客服派單', description: '處理客戶技術支援請求', to: '/crm/tickets', icon: LifeBuoy, group: 'CRM' },
  { id: 'users',     label: '用戶管理', description: '管理系統使用者權限', to: '/admin/users', icon: Users, group: '管理' },
  { id: 'roles',     label: '角色管理', description: '設定角色權限與範圍', to: '/admin/roles', icon: ShieldCheck, group: '管理' },
  { id: 'settings',  label: '系統設定', description: '調整系統全域參數', to: '/admin/settings', icon: Settings, group: '管理' },
  { id: 'audit',     label: '稽核日誌', description: '查看系統操作軌跡紀錄', to: '/admin/audit', icon: ClipboardList, group: '管理' },
]

// 模擬搜尋結果 (擴展用)
const mockData = [
  { id: 'cust-1', label: '鴻海精密', description: 'VIP 客戶 - 電子製造業', to: '/crm/customers', icon: Building, group: '常用客戶' },
  { id: 'deal-1', label: '基礎工程合約', description: '進行中 - $1,200,000', to: '/crm/deals', icon: Kanban, group: '近期商機' },
]

const allItems = [...navItems, ...mockData]

const filteredResults = computed(() => {
  if (!query.value) return allItems
  const q = query.value.toLowerCase()
  return allItems.filter(i => 
    i.label.toLowerCase().includes(q) || 
    i.description.toLowerCase().includes(q) ||
    i.group.toLowerCase().includes(q)
  )
})

const groupedResults = computed(() => {
  const groups: Record<string, any[]> = {}
  let currentAbsoluteIndex = 0
  
  filteredResults.value.forEach(item => {
    if (!groups[item.group]) groups[item.group] = []
    const targetGroup = groups[item.group]
    if (targetGroup) {
      targetGroup.push({
        ...item,
        absoluteIndex: currentAbsoluteIndex++
      })
    }
  })

  return Object.entries(groups).map(([title, items]) => ({ title, items }))
})

const maxIndex = computed(() => filteredResults.value.length - 1)

function move(step: number) {
  let next = activeIndex.value + step
  if (next < 0) next = maxIndex.value
  if (next > maxIndex.value) next = 0
  activeIndex.value = next
}

function isSelected(idx: number) {
  return activeIndex.value === idx
}

function selectCurrent() {
  if (filteredResults.value.length > 0 && activeIndex.value >= 0 && activeIndex.value < filteredResults.value.length) {
    const item = filteredResults.value[activeIndex.value]
    if (item) executeItem(item)
  }
}

function executeItem(item: any) {
  if (item && item.to) {
    router.push(item.to)
    ui.commandPaletteOpen = false
    query.value = ''
  }
}

// 自動聚焦輸入框
watch(() => ui.commandPaletteOpen, (val) => {
  if (val) {
    activeIndex.value = 0
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.glass-dark {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
}

.animate-scale-in {
  animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes bounce-x {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
.animate-bounce-x {
  animation: bounce-x 1s infinite;
}

.scrollbar-premium::-webkit-scrollbar { width: 4px; }
.scrollbar-premium::-webkit-scrollbar-track { background: transparent; }
.scrollbar-premium::-webkit-scrollbar-thumb { 
  background-color: rgba(51, 65, 85, 0.5); 
  border-radius: 9999px;
}
</style>
