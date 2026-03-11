<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-slate-900 to-slate-800 p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
    </div>

    <Transition name="fade-up" appear>
      <div class="relative w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/40 mb-4">
            <LayoutDashboard class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-white">AdminKit</h1>
          <p class="text-slate-400 text-sm mt-1">登入您的管理員帳號</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <!-- 錯誤訊息 -->
          <Transition name="fade">
            <div v-if="errorMsg"
              class="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
              <CircleAlert class="w-4 h-4 shrink-0" />{{ errorMsg }}
            </div>
          </Transition>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">電子郵件</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="form.email" type="email" required placeholder="you@example.com"
                  class="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-slate-300">密碼</label>
                <RouterLink to="/forgot-password" class="text-xs text-primary-400 hover:text-primary-300 transition">
                  忘記密碼？</RouterLink>
              </div>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="form.password" :type="showPwd ? 'text' : 'password'" required placeholder="••••••••"
                  class="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
                <button type="button" @click="showPwd = !showPwd"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  <Eye v-if="!showPwd" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="submit" :disabled="loading"
              class="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-primary-600/30 disabled:opacity-60 disabled:cursor-not-allowed">
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              {{ loading ? '登入中...' : '登入' }}
            </button>
          </form>

          <div class="flex items-center gap-3 my-5">
            <div class="flex-1 h-px bg-white/10"></div>
            <span class="text-xs text-slate-400">或</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>

          <button @click="handleGoogle" :disabled="loading"
            class="w-full flex items-center justify-center gap-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all text-sm font-medium">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            使用 Google 登入
          </button>

          <p class="text-center text-sm text-slate-400 mt-6">
            還沒有帳號？
            <RouterLink to="/register" class="text-primary-400 hover:text-primary-300 font-medium transition">立即註冊
            </RouterLink>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, Loader2, CircleAlert } from 'lucide-vue-next'
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
