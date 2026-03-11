import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface UploadResult {
  path: string | null
  url: string | null
  error: string | null
}

/**
 * 通用上傳組合式函數（TypeScript）
 *
 * 使用方式：
 *   const { progress, url, uploading, upload, remove } = useUpload('avatars')
 *   const result = await upload(file)
 */
export function useUpload(bucket: string) {
  const progress  = ref(0)
  const url       = ref<string | null>(null)
  const uploading = ref(false)
  const error     = ref<string | null>(null)

  async function upload(file: File, customPath?: string): Promise<UploadResult> {
    uploading.value = true
    progress.value  = 0
    error.value     = null

    const auth     = useAuthStore()
    const ext      = file.name.split('.').pop()
    const userId   = auth.user?.id || 'anonymous'
    const filePath = customPath || `${userId}/${Date.now()}.${ext}`

    try {
      const { data: signedData, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath)

      if (signErr) throw signErr

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedData.signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) progress.value = Math.round((e.loaded / e.total) * 100)
        })
        xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(file)
      })

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      url.value      = urlData.publicUrl
      progress.value = 100
      return { path: filePath, url: url.value, error: null }
    } catch (e: any) {
      error.value = e.message
      return { path: null, url: null, error: e.message }
    } finally {
      uploading.value = false
    }
  }

  async function remove(filePath: string) {
    const { error: err } = await supabase.storage.from(bucket).remove([filePath])
    return { error: err }
  }

  return { progress, url, uploading, error, upload, remove }
}
