<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] transition-colors duration-500 relative overflow-hidden p-6">
    <!-- Premium Animated Background -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 dark:bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: -2s"></div>
    </div>

    <Transition name="fade-up" appear>
      <div class="relative w-full max-w-[440px] z-10">
        <!-- Logo & Header -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-600/40 mb-6 group hover:scale-110 transition-transform duration-500">
            <LayoutDashboard class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">AdminKit <span class="text-primary-500 text-sm font-bold uppercase tracking-widest align-middle ml-1">Pro</span></h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium">企業級智慧管理平台</p>
        </div>

        <div class="bg-white/70 dark:bg-white/10 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
          <!-- Subtle Inner Glow -->
          <div class="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>

          <!-- 錯誤訊息 -->
          <Transition name="fade">
            <div v-if="errorMsg" class="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
              <CircleAlert class="w-4 h-4 shrink-0" />{{ errorMsg }}
            </div>
          </Transition>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">電子郵件帳號</label>
              <div class="relative group/input">
                <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 transition-colors" />
                <input v-model="form.email" type="email" required placeholder="you@example.com"
                  class="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-medium" />
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between ml-1">
                <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">存取密碼</label>
                <RouterLink to="/forgot-password" class="text-xs font-bold text-primary-500 hover:text-primary-400 transition">忘記密碼？</RouterLink>
              </div>
              <div class="relative group/input">
                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within/input:text-primary-500 transition-colors" />
                <input v-model="form.password" :type="showPwd ? 'text' : 'password'" required placeholder="••••••••"
                  class="w-full pl-12 pr-12 py-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-medium" />
                <button type="button" @click="showPwd = !showPwd" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Eye v-if="!showPwd" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <button type="submit" :disabled="loading"
              class="w-full group/btn relative overflow-hidden flex items-center justify-center gap-3 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary-600/30 disabled:opacity-50 active:scale-95">
              <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              <span class="tracking-wide">{{ loading ? '驗證身分中...' : '立即登入系統' }}</span>
              <ArrowRight v-if="!loading" class="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </form>

          <div class="flex items-center gap-4 my-8">
            <div class="flex-1 h-px bg-white/10"></div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-tighter">快速通關</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>

          <button @click="handleGoogle" :disabled="loading"
            class="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl transition-all shadow-sm dark:shadow-none text-sm font-bold active:scale-95">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google 帳號登入
          </button>

          <p class="text-center text-sm font-medium text-slate-500 mt-8">
            尚未擁有憑證？
            <RouterLink to="/register" class="text-primary-500 hover:text-primary-400 font-bold transition">註冊新帳號</RouterLink>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, Loader2, CircleAlert, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: 'test@ggg.com', password: 'P@ssw0rd' })
const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await auth.signIn(form.email, form.password)
  if (error) {
    errorMsg.value = (error as any).message === 'Invalid login credentials' ? '電子郵件或密碼錯誤' : (error as any).message
  } else {
    router.push((route.query.redirect as string) || '/dashboard')
  }
  loading.value = false
}

async function handleGoogle() {
  loading.value = true
  await auth.signInWithGoogle()
  loading.value = false
}
</script>

<style scoped>
.fade-up-enter-active {
  animation: fadeUp 0.4s ease-out;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
