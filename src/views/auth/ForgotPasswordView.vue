<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-slate-900 to-slate-800 p-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
    </div>
    <Transition name="fade-up" appear>
      <div class="relative w-full max-w-md">
        <div class="text-center mb-8">
          <RouterLink to="/login" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/40 mb-4">
            <LayoutDashboard class="w-8 h-8 text-white" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-white">重設密碼</h1>
          <p class="text-slate-400 text-sm mt-1">輸入電子郵件，我們將寄出重設連結</p>
        </div>

        <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <Transition name="fade">
            <div v-if="sent" class="text-center py-4">
              <CircleCheck class="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p class="text-white font-medium">重設連結已寄出！</p>
              <p class="text-slate-400 text-sm mt-1">請至信箱查收，並點擊連結重設密碼。</p>
              <RouterLink to="/login" class="mt-5 inline-block text-primary-400 hover:text-primary-300 text-sm font-medium transition">← 返回登入</RouterLink>
            </div>
            <form v-else @submit.prevent="handleReset" class="space-y-5">
              <div v-if="errorMsg" class="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg px-4 py-3 text-sm">
                <CircleAlert class="w-4 h-4 shrink-0" />{{ errorMsg }}
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">電子郵件</label>
                <div class="relative">
                  <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input v-model="email" type="email" required placeholder="you@example.com"
                    class="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition" />
                </div>
              </div>
              <button type="submit" :disabled="loading"
                class="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-primary-600/30 disabled:opacity-60">
                <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                {{ loading ? '發送中...' : '發送重設連結' }}
              </button>
              <p class="text-center text-sm">
                <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium transition">← 返回登入</RouterLink>
              </p>
            </form>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LayoutDashboard, Mail, Loader2, CircleAlert, CircleCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth     = useAuthStore()
const email    = ref('')
const loading  = ref(false)
const errorMsg = ref('')
const sent     = ref(false)

async function handleReset() {
  loading.value  = true
  errorMsg.value = ''
  const { error } = await auth.resetPassword(email.value)
  if (error) { errorMsg.value = (error as any).message } else { sent.value = true }
  loading.value = false
}
</script>

<style scoped>
.fade-up-enter-active { animation: fadeUp 0.4s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(1.5rem); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
