import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

let _id = 0

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([])

  function add({ type = 'info' as ToastType, title = '', message = '', duration = 4000 }) {
    const id = ++_id
    toasts.value.push({ id, type, title, message })
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (message: string, title = '成功') => add({ type: 'success', title, message })
  const error   = (message: string, title = '錯誤') => add({ type: 'error',   title, message })
  const info    = (message: string, title = '通知') => add({ type: 'info',    title, message })
  const warning = (message: string, title = '警告') => add({ type: 'warning', title, message })

  return { toasts, add, remove, success, error, info, warning }
})
