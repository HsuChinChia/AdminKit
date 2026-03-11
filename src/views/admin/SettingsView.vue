<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">系統設定</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">全域參數與應用程式配置</p>
      </div>
    </div>
    
    <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-sm border border-slate-100 dark:border-surface-dark-border p-8 text-center">
      <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Settings class="w-8 h-8 text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-800 dark:text-white mb-2">設定模組開發中</h3>
      <p class="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        全域設定介面尚未實作。此頁面目前僅作為權限系統測試節點使用。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
</script>
