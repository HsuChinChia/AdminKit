<template>
  <aside :class="[
    'flex flex-col bg-white dark:bg-surface-dark-muted border-r border-surface-border dark:border-surface-dark-border shrink-0 transition-all duration-300 ease-in-out',
    ui.sidebarOpen ? 'w-64' : 'w-16',
  ]">
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-surface-border dark:border-surface-dark-border">
      <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
        <LayoutDashboard class="w-4 h-4 text-white" />
      </div>
      <Transition name="fade">
        <span v-if="ui.sidebarOpen" class="ml-3 font-bold text-slate-800 dark:text-white whitespace-nowrap">AdminKit</span>
      </Transition>
    </div>

    <!-- 導航連結 -->
    <nav class="flex-1 py-4 space-y-1 px-2">
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
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
          :class="isActive(item.to)
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'"
          :title="!ui.sidebarOpen ? item.label : undefined"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0"
            :class="isActive(item.to) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'"
          />
          <Transition name="fade">
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
  LifeBuoy
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
      { name: 'users', label: '用戶管理', to: '/admin/users', icon: Users, permissions: ['users:view'] },
      { name: 'roles', label: '角色管理', to: '/admin/roles', icon: ShieldCheck, permissions: ['roles:view'] },
      { name: 'settings', label: '系統設定', to: '/admin/settings', icon: Settings, permissions: ['settings:view'] },
    ],
  },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
