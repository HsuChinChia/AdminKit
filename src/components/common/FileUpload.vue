<template>
  <div class="w-full">
    <div 
      class="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-colors"
      :class="[
        isDragging 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800',
        uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'
      ]"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <div v-if="!uploading" class="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud class="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500" />
        <p class="mb-2 text-sm text-slate-500 dark:text-slate-400">
          <span class="font-semibold text-primary-600 dark:text-primary-400">點擊上傳</span> 或將檔案拖曳至此
        </p>
        <p class="text-xs text-slate-400 dark:text-slate-500">
          支援 {{ acceptedTypes.join(', ') }} (最大 {{ maxSizeMB }}MB)
        </p>
      </div>

      <!-- Uploading State -->
      <div v-else class="flex flex-col items-center justify-center w-full px-8">
        <Loader2 class="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <div 
            class="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
          上傳中... {{ Math.round(progress) }}%
        </p>
      </div>

      <input 
        ref="fileInputRef"
        type="file"
        class="hidden"
        :accept="acceptString"
        @change="onFileSelected"
      />
    </div>

    <!-- Preview List (Optional depending on requirements) -->
    <div v-if="currentUrl && !uploading" class="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-3 overflow-hidden">
        <FileIcon class="w-8 h-8 text-primary-500 shrink-0" />
        <div class="truncate">
          <a :href="currentUrl" target="_blank" class="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
            檢視已上傳的檔案
          </a>
        </div>
      </div>
      <button 
        @click="emit('remove')"
        type="button" 
        class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadCloud, File as FileIcon, Loader2, Trash2 } from 'lucide-vue-next'
import { useUpload } from '@/composables/useUpload'
import { useNotificationStore } from '@/stores/notifications'

const props = withDefaults(defineProps<{
  bucket: string
  userId: string
  currentUrl?: string | null
  maxSizeMB?: number
  acceptedTypes?: string[]
}>(), {
  maxSizeMB: 10,
  acceptedTypes: () => ['PDF', 'PNG', 'JPG']
})

const emit = defineEmits<{
  (e: 'update:url', url: string): void
  (e: 'remove'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const notify = useNotificationStore()

const { upload, uploading, progress } = useUpload(props.bucket)

const acceptString = computed(() => {
  return props.acceptedTypes.map(t => {
    t = t.toLowerCase()
    return t === 'pdf' ? 'application/pdf' : `image/${t}`
  }).join(',')
})

function triggerFileInput() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

async function onDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file) await handleFileSelection(file)
  }
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file) await handleFileSelection(file)
    // Reset inputs
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

async function handleFileSelection(file: File) {
  // 檢查大小
  if (file.size > props.maxSizeMB * 1024 * 1024) {
    notify.error('檔案過大', `請上傳小於 ${props.maxSizeMB}MB 的檔案`)
    return
  }

  // 嘗試進行上傳
  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `${props.userId}/documents/${Date.now()}.${fileExt}`
    
    const { url, error } = await upload(file, filePath)
    
    if (error) throw new Error(error)
    if (url) {
      emit('update:url', url)
      notify.success('檔案上傳成功')
    }
  } catch (err: any) {
    notify.error(err.message || '上傳失敗', '檔案上傳錯誤')
  }
}
</script>
