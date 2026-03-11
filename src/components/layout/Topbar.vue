<template>
  <header class="h-16 bg-white dark:bg-surface-dark-muted border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between px-6 shrink-0">
    <!-- 左：折疊 + 麵包屑 -->
    <div class="flex items-center gap-4">
      <button @click="ui.toggleSidebar()" class="btn-ghost p-2 rounded-lg">
        <PanelLeft class="w-5 h-5" />
      </button>
      <nav class="flex items-center gap-1 text-sm">
        <span class="text-slate-400">AdminKit</span>
        <ChevronRight class="w-3 h-3 text-slate-300" />
        <span class="font-medium text-slate-700 dark:text-slate-200">{{ currentTitle }}</span>
      </nav>
    </div>

    <!-- 右：工具列 -->
    <div class="flex items-center gap-2">
      <!-- 主題切換 -->
      <button @click="ui.toggleTheme()" class="btn-ghost p-2 rounded-lg">
        <Sun v-if="ui.theme === 'dark'" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>

      <!-- 用戶下拉 -->
      <div class="relative">
        <button
          @click="open = !open"
          class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {{ userInitial }}
          </div>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
            {{ auth.profile?.username || '用戶' }}
          </span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>

        <Transition name="dropdown">
          <div v-if="open" class="absolute right-0 top-full mt-2 w-48 card shadow-lg z-50">
            <div class="py-1">
              <RouterLink to="/profile" @click="open = false"
                class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                <User class="w-4 h-4" />個人資料
              </RouterLink>
              <hr class="my-1 border-surface-border dark:border-surface-dark-border" />
              <button @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                <LogOut class="w-4 h-4" />登出
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }         from '@/stores/auth'
import { useUiStore }           from '@/stores/ui'
import { PanelLeft, ChevronRight, ChevronDown, Sun, Moon, User, LogOut } from 'lucide-vue-next'

const auth   = useAuthStore()
const ui     = useUiStore()
const route  = useRoute()
const router = useRouter()
const open   = ref(false)

const userInitial    = computed(() => (auth.profile?.username || auth.user?.email || '?').charAt(0).toUpperCase())
const currentTitle   = computed(() => (route.meta.title as string) || '首頁')

async function handleLogout() {
  open.value = false
  await auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-0.5rem); }
</style>
