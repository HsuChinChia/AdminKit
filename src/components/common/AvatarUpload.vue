<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Avatar Preview -->
    <div class="relative group">
      <div 
        class="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center relative bg-cover bg-center"
        :style="avatarStyle"
      >
        <User v-if="!currentUrl && !previewUrl" class="w-12 h-12 text-slate-300 dark:text-slate-600" />
        
        <!-- Hover Overlay -->
        <div 
          v-if="!uploading"
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
          @click="triggerFileInput"
        >
          <Camera class="w-8 h-8 text-white" />
        </div>

        <!-- Uploading Spinner -->
        <div 
          v-if="uploading"
          class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]"
        >
          <Loader2 class="w-6 h-6 text-white animate-spin mb-1" />
          <span class="text-xs text-white font-medium">{{ Math.round(progress) }}%</span>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input 
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileSelected"
    />

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button 
        v-if="!previewUrl && !uploading"
        @click="triggerFileInput"
        type="button"
        class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
      >
        選擇照片
      </button>

      <template v-if="previewUrl && !uploading">
        <button 
          @click="handleUpload"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <UploadCloud class="w-4 h-4" /> 確認上傳
        </button>
        <button 
          @click="cancelPreview"
          type="button"
          class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          取消
        </button>
      </template>

      <button 
        v-if="props.currentUrl && !previewUrl && !uploading"
        @click="emit('remove')"
        type="button"
        class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="移除頭像"
      >
        <Trash2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Camera, Loader2, UploadCloud, Trash2 } from 'lucide-vue-next'
import { useUpload } from '@/composables/useUpload'
import { useNotificationStore } from '@/stores/notifications'

const props = defineProps<{
  bucket: string
  currentUrl?: string | null
  userId: string
}>()

const emit = defineEmits<{
  (e: 'update:url', url: string): void
  (e: 'remove'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const notify = useNotificationStore()

const { upload, uploading, progress } = useUpload(props.bucket)

const avatarStyle = computed(() => {
  const url = previewUrl.value || props.currentUrl
  if (url) {
    return { backgroundImage: `url(${url})` }
  }
  return {}
})

function triggerFileInput() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 驗證圖片格式與大小 (例如限制 5MB)
  if (!file.type.startsWith('image/')) {
    notify.error('檔案格式錯誤', '只能上傳圖片檔案')
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    notify.error('檔案過大', '圖片大小不能超過 5MB')
    return
  }

  selectedFile.value = file
  
  // 建立本地預覽 URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  
  // Reset input value so the same file could be selected again if needed
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function cancelPreview() {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

async function handleUpload() {
  if (!selectedFile.value || !props.userId) return
  
  try {
    // 檔名格式: userId/timestamp-filename
    const fileExt = selectedFile.value.name.split('.').pop()
    const filePath = `${props.userId}/${Date.now()}.${fileExt}`
    
    const { url, error } = await upload(selectedFile.value, filePath)
    
    if (error) {
      throw new Error(error)
    }

    if (url) {
      // 觸發自定義事件向父層報告新網址，讓父層更新 profiles
      emit('update:url', url)
      notify.success('頭像上傳成功')
      cancelPreview() // 清除預覽狀態
    }
  } catch (error: any) {
    notify.error(error.message || '上傳失敗', '頭像上傳錯誤')
  }
}
</script>
