<template>
  <header class="h-20 glass border-b border-white/10 dark:border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30">
    <!-- 左：折疊 + 麵包屑 -->
    <div class="flex items-center gap-2 md:gap-4 overflow-hidden">
      <button @click="ui.toggleSidebar()" class="btn-ghost p-2 md:p-2.5 rounded-xl transition-transform active:scale-95 shrink-0">
        <PanelLeft class="w-5 h-5 text-slate-500" />
      </button>
      <nav class="flex items-center gap-1 text-sm overflow-hidden">
        <span class="text-slate-400 hidden sm:block shrink-0">AdminKit</span>
        <ChevronRight class="w-3 h-3 text-slate-300 hidden sm:block shrink-0" />
        <span class="font-medium text-slate-700 dark:text-slate-200 truncate">{{ currentTitle }}</span>
      </nav>
    </div>

    <!-- 右：工具列 -->
    <div class="flex items-center gap-2">
      <!-- 快速搜尋按鈕 -->
      <button 
        @click="ui.toggleCommandPalette()" 
        class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
        title="快速搜尋 (Ctrl+K)"
      >
        <Search class="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
        <span class="text-xs font-medium text-slate-500 dark:text-slate-400">快速搜尋...</span>
        <kbd class="ml-2 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[10px] text-slate-400 font-sans shadow-sm">⌘K</kbd>
      </button>

      <!-- 手機版搜尋圖示 -->
      <button @click="ui.toggleCommandPalette()" class="md:hidden btn-ghost p-2.5 rounded-xl">
        <Search class="w-5 h-5 text-slate-500" />
      </button>

      <!-- 主題切換 -->
      <button @click="ui.toggleTheme()" class="btn-ghost p-2.5 rounded-xl hover:scale-110 active:scale-90 transition-all duration-300">
        <Sun v-if="ui.theme === 'dark'" class="w-5 h-5 text-amber-400" />
        <Moon v-else class="w-5 h-5 text-indigo-500" />
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
          <div v-if="open" class="absolute right-0 top-full mt-3 w-56 glass border-white/20 dark:border-white/5 rounded-2xl shadow-premium z-50 overflow-hidden">
            <div class="py-2">
              <div class="px-4 py-3 border-b border-white/10 dark:border-white/5 mb-1">
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">目前身份</p>
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{{ auth.profile?.username || '管理員' }}</p>
              </div>
              <RouterLink to="/profile" @click="open = false"
                class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                <User class="w-4 h-4" />個人資料
              </RouterLink>
              <hr class="my-1 border-white/10 dark:border-white/5" />
              <button @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all">
                <LogOut class="w-4 h-4" />登出系統
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
import { PanelLeft, ChevronRight, ChevronDown, Sun, Moon, User, LogOut, Search } from 'lucide-vue-next'

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
.dropdown-enter-active, .dropdown-leave-active { 
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
}
.dropdown-enter-from { opacity: 0; transform: translateY(10px) scale(0.95); }
.dropdown-leave-to { opacity: 0; transform: translateY(10px) scale(0.95); }
</style>
