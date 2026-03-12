import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const theme       = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )
  const sidebarOpen = ref(window.innerWidth >= 1024)
  const commandPaletteOpen = ref(false)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }
  function closeSidebar() {
    sidebarOpen.value = false
  }
  function toggleCommandPalette() {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  watch(theme, (val) => {
    localStorage.setItem('theme', val)
    document.documentElement.classList.toggle('dark', val === 'dark')
  }, { immediate: true })

  return { 
    theme, 
    sidebarOpen, 
    commandPaletteOpen,
    toggleTheme, 
    toggleSidebar, 
    closeSidebar, 
    toggleCommandPalette 
  }
})
