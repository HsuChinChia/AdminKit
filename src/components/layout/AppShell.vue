<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-surface-dark relative">
    <!-- Premium Background Mesh -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] animate-pulse-soft"></div>
      <div class="absolute top-[20%] -left-[10%] w-[35%] h-[35%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] animate-pulse-soft" style="animation-delay: -1s"></div>
      <div class="absolute -bottom-[10%] right-[20%] w-[30%] h-[30%] bg-sky-400/10 dark:bg-sky-400/5 rounded-full blur-[80px] animate-pulse-soft" style="animation-delay: -2s"></div>
    </div>

    <Sidebar class="relative z-10" />
    
    <div class="flex-1 flex flex-col overflow-hidden relative z-10">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import Sidebar        from '@/components/layout/Sidebar.vue'
import Topbar         from '@/components/layout/Topbar.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<style scoped>
.page-enter-active, .page-leave-active {
  transition: opacity 0.25s ease;
}
.page-enter-from, .page-leave-to { opacity: 0; }

/* Custom scrollbar for main area */
main::-webkit-scrollbar {
  width: 6px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
main::-webkit-scrollbar-thumb {
  @apply bg-slate-200 dark:bg-slate-800 rounded-full;
}
</style>
