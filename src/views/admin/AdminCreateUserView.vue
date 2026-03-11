<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <!-- 標題區 -->
    <div class="flex items-center gap-4 border-b border-surface-border dark:border-surface-dark-border pb-4">
      <RouterLink to="/admin/users"
        class="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </RouterLink>
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">新增用戶</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">建立新的系統使用者帳號</p>
      </div>
    </div>

    <!-- 表單卡片 -->
    <div
      class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-sm border border-surface-border dark:border-surface-dark-border overflow-hidden">
      <form @submit.prevent="handleSubmit" class="p-6 md:p-8 space-y-6">

        <!-- 用戶名稱 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            用戶名稱
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.username" type="text" required placeholder="例如：王小明"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow" />
          </div>
        </div>

        <!-- 電話號碼 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            電話號碼 (選填)
          </label>
          <div class="relative">
            <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.phone" type="tel" placeholder="例如：0912345678"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow" />
          </div>
        </div>

        <!-- 性別 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            性別 (選填)
          </label>
          <div class="relative">
            <UserCircle class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select v-model="form.gender"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow appearance-none">
              <option value="">未指定</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        <!-- 電子郵件 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            電子郵件 (登入帳號)
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              v-model="form.email" 
              type="email" 
              required
              placeholder="user@example.com"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow" 
            />
          </div>
        </div>

        <!-- 角色權限 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            角色權限
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <ShieldCheck class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select v-model="form.role_id" required
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow appearance-none">
              <option value="" disabled>請選擇角色</option>
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">此角色將決定該用戶進入系統後的權限範圍。</p>
        </div>

        <!-- 初始密碼 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">
            初始密碼
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required minlength="6"
              placeholder="請輸入至少 6 個字元的密碼"
              class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>



        <!-- 按鈕區 -->
        <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <RouterLink to="/admin/users"
            class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors disabled:opacity-50">
            取消
          </RouterLink>
          <button type="submit" :disabled="loading"
            class="px-5 py-2.5 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-primary-500/50 disabled:opacity-70 disabled:cursor-not-allowed">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            {{ loading ? '處理中...' : '建立用戶' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, User, Phone, UserCircle, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Info } from 'lucide-vue-next'

const router = useRouter()
const notify = useNotificationStore()
const auth = useAuthStore()

const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  username: '',
  email: '',
  phone: '',
  gender: '',
  password: '',
  role_id: ''
})

const availableRoles = ref<{ id: string, name: string }[]>([])

onMounted(async () => {
  if (!auth.hasPermission('users:create')) {
    notify.error('權限不足', '您沒有新增用戶的權限')
    router.push('/admin/users')
    return
  }
  const { data } = await supabase.from('roles').select('id, name').order('created_at', { ascending: true })
  if (data) availableRoles.value = data
})

async function handleSubmit() {
  loading.value = true

  try {
    // 呼叫我們剛剛建立的 Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: form.email,
        password: form.password,
        username: form.username,
        phone: form.phone,
        gender: form.gender,
        role_id: form.role_id
      }
    })

    // 如果網路層出錯 (例如 Edge Function 沒部署、CORS等)
    if (error) throw error
    // 如果 Edge Function 內部自定義的錯誤 (我們回傳了 { error: "..." })
    if (data?.error) throw new Error(data.error)

    // 成功通知
    notify.success(`已成功建立用戶「${form.username}」！`, '成功')

    // 導回列表頁
    router.push('/admin/users')
  } catch (err: any) {
    notify.error(err.message || '建立失敗，請確認 Edge Function 是否已部署', '錯誤')
  } finally {
    loading.value = false
  }
}
</script>
