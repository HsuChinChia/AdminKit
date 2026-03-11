<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-slate-900 to-slate-800 p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
    </div>

    <Transition name="fade-up" appear>
      <div class="relative w-full max-w-md">
        <div class="text-center mb-8">
          <RouterLink to="/login" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/40 mb-4">
            <LayoutDashboard class="w-8 h-8 text-white" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-white">建立帳號</h1>
          <p class="text-slate-400 text-sm mt-1">加入 AdminKit 開始管理</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <Transition name="fade">
            <div v-if="successMsg" class="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-lg px-4 py-3 mb-5 text-sm">
              <CircleCheck class="w-4 h-4 shrink-0" />{{ successMsg }}
            </div>
            <div v-else-if="errorMsg" class="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg px-4 py-3 mb-5 text-sm">
              <CircleAlert class="w-4 h-4 shrink-0" />{{ errorMsg }}
            </div>
          </Transition>

          <form @submit.prevent="handleRegister" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">用戶名稱</label>
              <div class="relative">
                <UserIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="form.username" type="text" required placeholder="您的名稱"
                  class="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">電子郵件</label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="form.email" type="email" required placeholder="you@example.com"
                  class="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-1.5">密碼</label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input v-model="form.password" :type="showPwd ? 'text' : 'password'" required placeholder="至少 6 個字元"
                  class="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
                <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  <Eye v-if="!showPwd" class="w-4 h-4" /><EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <button type="submit" :disabled="loading"
              class="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-primary-600/30 disabled:opacity-60 disabled:cursor-not-allowed">
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              {{ loading ? '註冊中...' : '建立帳號' }}
            </button>
          </form>

          <p class="text-center text-sm text-slate-400 mt-6">
            已有帳號？<RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium transition">返回登入</RouterLink>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { LayoutDashboard, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CircleAlert, CircleCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const form = reactive({ username: '', email: '', password: '' })
const loading    = ref(false)
const showPwd    = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')

async function handleRegister() {
  loading.value   = true
  errorMsg.value  = ''
  successMsg.value = ''
  const { error } = await auth.signUp(form.email, form.password, form.username)
  if (error) {
    errorMsg.value = (error as any).message
  } else {
    successMsg.value = '📧 驗證信已寄出！請至信箱確認後登入。'
    form.username = ''; form.email = ''; form.password = ''
  }
  loading.value = false
}
</script>

<style scoped>
.fade-up-enter-active { animation: fadeUp 0.4s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(1.5rem); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
