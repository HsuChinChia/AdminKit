<template>
  <aside :class="[
    'flex flex-col glass border-r border-white/10 dark:border-white/5 shrink-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-40',
    'fixed inset-y-0 left-0 lg:relative',
    ui.sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0',
    !ui.sidebarOpen && 'lg:w-20'
  ]">
    <!-- Logo -->
    <div class="flex items-center h-20 px-6 border-b border-white/10 dark:border-white/5">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-600/30 flex items-center justify-center shrink-0">
          <LayoutDashboard class="w-5 h-5 text-white" />
        </div>
        <Transition name="fade-slide">
          <span v-if="ui.sidebarOpen" class="ml-4 font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 whitespace-nowrap">AdminKit</span>
        </Transition>
      </div>
    </div>

    <!-- 導航連結 -->
    <nav class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      <template v-for="group in navGroups" :key="group.label">
        <Transition name="fade">
          <p v-if="ui.sidebarOpen" class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1 mt-3">
            {{ group.label }}
          </p>
        </Transition>
        <RouterLink
          v-for="item in group.items"
          v-show="!item.permissions || item.permissions.every(p => auth.hasPermission(p))"
          :key="item.name"
          :to="item.to"
          @click="handleNavClick"
          class="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all relative group overflow-hidden"
          :class="isActive(item.to)
            ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-500/5'"
          :title="!ui.sidebarOpen ? item.label : undefined"
        >
          <!-- Active Indicator Bar -->
          <div v-if="isActive(item.to)" class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-600 rounded-r-full"></div>
          
          <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
            :class="isActive(item.to) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'"
          />
          <Transition name="fade-slide">
            <span v-if="ui.sidebarOpen" class="whitespace-nowrap">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </template>
    </nav>

    <!-- 底部用戶 -->
    <div class="p-3 border-t border-surface-border dark:border-surface-dark-border">
      <div class="flex items-center gap-3 px-2 py-2">
        <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {{ userInitial }}
        </div>
        <Transition name="fade">
          <div v-if="ui.sidebarOpen" class="overflow-hidden min-w-0">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ auth.profile?.username || auth.user?.email }}</p>
            <p class="text-xs text-slate-400 capitalize">{{ auth.role }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import { LayoutDashboard, ChartColumn, User, Users, Settings, ShieldCheck,  Building,
  Kanban,
  FileText,
  LifeBuoy,
  ClipboardList,
  X
} from 'lucide-vue-next'

const auth  = useAuthStore()
const ui    = useUiStore()
const route = useRoute()

const userInitial = computed(() => {
  const name = auth.profile?.username || auth.user?.email || '?'
  return name.charAt(0).toUpperCase()
})

interface NavItem {
  name: string
  label: string
  to: string
  icon: Component
  permissions?: string[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: '主要功能',
    items: [
      { name: 'profile',   label: '個人資料', to: '/profile',   icon: User, permissions: ['profile:view'] },
      { name: 'dashboard', label: '儀表板',   to: '/dashboard', icon: ChartColumn, permissions: ['dashboard:view'] },
    ],
  },
  {
    label: 'CRM 客戶關係',
    items: [
      { name: 'customers', label: '客戶管理', to: '/crm/customers', icon: Building, permissions: ['customers:view'] },
      { name: 'deals',     label: '銷售漏斗', to: '/crm/deals',     icon: Kanban,   permissions: ['deals:view'] },
      { name: 'contracts', label: '合約與文件', to: '/crm/contracts', icon: FileText, permissions: ['contracts:view'] },
      { name: 'tickets',   label: '客服派單', to: '/crm/tickets',   icon: LifeBuoy, permissions: ['tickets:view'] },
    ],
  },
  {
    label: '管理員',
    items: [
      { name: 'users',    label: '用戶管理', to: '/admin/users',    icon: Users,       permissions: ['users:view'] },
      { name: 'roles',    label: '角色管理', to: '/admin/roles',    icon: ShieldCheck, permissions: ['roles:view'] },
      { name: 'settings', label: '系統設定', to: '/admin/settings', icon: Settings,    permissions: ['settings:view'] },
      { name: 'audit',    label: '稽核日誌', to: '/admin/audit',    icon: ClipboardList, permissions: ['audit:view'] },
    ],
  },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}

function handleNavClick() {
  if (window.innerWidth < 1024) {
    ui.closeSidebar()
  }
}
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { 
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
}
.fade-slide-enter-from { opacity: 0; transform: translateX(-10px); }
.fade-slide-leave-to   { opacity: 0; transform: translateX(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
