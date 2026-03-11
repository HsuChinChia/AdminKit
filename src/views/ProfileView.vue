<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">個人資料</h1>
      <p class="text-slate-400 text-sm mt-1">管理您的帳號資訊</p>
    </div>

    <div class="card card-body space-y-6">
      <!-- 頭像上傳 -->
      <div class="flex items-center gap-6">
        <div class="shrink-0 relative">
          <AvatarUpload 
            bucket="avatars"
            :current-url="auth.profile?.avatar_url"
            :user-id="auth.user?.id || ''"
            @update:url="onAvatarUpdated"
            @remove="onAvatarRemoved"
          />
        </div>
        <div>
          <p class="font-medium text-slate-700 dark:text-slate-200">{{ auth.profile?.username || auth.user?.email }}</p>
          <span :class="auth.isAdmin ? 'badge badge-info' : 'badge badge-default'" class="mt-1">
            {{ auth.isAdmin ? '管理員' : '一般用戶' }}
          </span>
        </div>
      </div>

      <hr class="border-surface-border dark:border-surface-dark-border" />

      <!-- 編輯表單 -->
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="label">用戶名稱</label>
          <input v-model="username" type="text" required class="input" placeholder="您的顯示名稱" />
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">電子郵件</span>
            <span class="font-medium text-slate-700 dark:text-slate-200">{{ auth.user?.email }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">加入時間</span>
            <span class="font-medium text-slate-700 dark:text-slate-200">
              {{ auth.profile?.created_at ? new Date(auth.profile.created_at).toLocaleDateString('zh-TW') : '-' }}
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="resetForm" class="btn-secondary">取消</button>
          <button type="submit" :disabled="saving" class="btn-primary">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ saving ? '儲存中...' : '儲存變更' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore }         from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import AvatarUpload from '@/components/common/AvatarUpload.vue'

const auth   = useAuthStore()
const notify = useNotificationStore()
const saving = ref(false)

const username = ref(auth.profile?.username || '')

watch(() => auth.profile?.username, (val) => { if (val) username.value = val })

async function onAvatarUpdated(url: string) {
  // 當子元件上傳成功回報新網址時，更新到 profile
  const { error } = await auth.updateProfile({ avatar_url: url })
  if (error) notify.error((error as any).message)
}

async function onAvatarRemoved() {
  const { error } = await auth.updateProfile({ avatar_url: null })
  if (error) notify.error((error as any).message)
  else notify.success('頭像已移除')
}

async function saveProfile() {
  saving.value = true
  const { error } = await auth.updateProfile({ username: username.value })
  if (error) notify.error((error as any).message)
  else notify.success('個人資料已更新！')
  saving.value = false
}

function resetForm() {
  username.value = auth.profile?.username || ''
}
</script>
