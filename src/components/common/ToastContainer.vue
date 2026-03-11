<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="toast in notifications.toasts"
          :key="toast.id"
          class="flex items-start gap-3 p-4 rounded-xl shadow-2xl border cursor-pointer"
          :class="toastClass(toast.type)"
          @click="notifications.remove(toast.id)"
        >
          <component :is="toastIcon(toast.type)" class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs opacity-80 mt-0.5">{{ toast.message }}</p>
          </div>
          <X class="w-4 h-4 opacity-60 hover:opacity-100 transition shrink-0" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastType } from '@/stores/notifications'
import { useNotificationStore } from '@/stores/notifications'
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-vue-next'

const notifications = useNotificationStore()

function toastClass(type: ToastType) {
  const map: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700 dark:text-emerald-100',
    error:   'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/80 dark:border-red-700 dark:text-red-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/80 dark:border-amber-700 dark:text-amber-100',
    info:    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/80 dark:border-blue-700 dark:text-blue-100',
  }
  return map[type]
}

function toastIcon(type: ToastType) {
  return { success: CircleCheck, error: CircleAlert, warning: TriangleAlert, info: Info }[type]
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from   { opacity: 0; transform: translateX(2rem) scale(0.95); }
.toast-leave-to     { opacity: 0; transform: translateX(2rem); }
.toast-move         { transition: transform 0.3s ease; }
</style>
