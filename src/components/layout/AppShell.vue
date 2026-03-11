<template>
  <div class="flex h-screen overflow-hidden bg-surface-muted dark:bg-surface-dark">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-6">
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
.page-enter-active, .page-leave-active { transition: opacity 0.15s, transform 0.15s; }
.page-enter-from { opacity: 0; transform: translateY(0.5rem); }
.page-leave-to   { opacity: 0; transform: translateY(-0.5rem); }
</style>
