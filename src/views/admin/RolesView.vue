<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">角色管理</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">自訂身分組並分配各項存取權限</p>
      </div>
      <button 
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <ShieldPlus class="w-4 h-4" />
        新增角色
      </button>
    </div>

    <DataTable
      :columns="columns"
      :rows="(items as any[])"
      :loading="loading"
      :total="total"
      :current-page="page"
      :total-pages="totalPages"
      search-placeholder="搜尋角色名稱..."
      @search="onSearch"
      @sort="onSort"
      @page-change="onPageChange"
    >
      <template #cell-permissions="{ value }">
        <div class="flex flex-wrap gap-1">
          <span v-for="p in (value as string[])" :key="p" class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs">
            {{ formatPermission(p) }}
          </span>
        </div>
      </template>
      <template #cell-created_at="{ value }">
        {{ value ? new Date(String(value)).toLocaleDateString('zh-TW') : '-' }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1">
          <button 
            @click="openModal(row)"
            class="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
            title="編輯角色"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button 
            @click="confirmDelete(row)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            title="刪除角色"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- 編輯角色 Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">{{ isEditing ? '編輯角色' : '新增角色' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveRole" class="p-6 space-y-6 overflow-y-auto">
          <!-- 角色名稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              角色名稱 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.name" 
              type="text" 
              required
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50" 
            />
          </div>
          
          <!-- 權限選擇區 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">搭配權限</label>
            
            <label class="flex items-start gap-3 cursor-pointer group mb-4 p-4 border border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/20 rounded-lg">
              <div class="relative flex items-center pt-0.5">
                <input 
                  type="checkbox" 
                  value="all" 
                  v-model="form.permissions"
                  class="w-4 h-4 text-primary-600 bg-white border-primary-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 focus:ring-2 dark:bg-slate-800 dark:border-primary-600 cursor-pointer"
                >
              </div>
              <div>
                <div class="text-sm font-semibold text-primary-700 dark:text-primary-400">
                  擁有全部權限 (Super Admin)
                </div>
                <div class="text-xs text-primary-600/80 dark:text-primary-400/80 mt-0.5">
                  賦予此角色的用戶將無條件擁有系統內所有操作權限，請謹慎勾選。
                </div>
              </div>
            </label>

            <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': form.permissions.includes('all') }">
              <div v-for="mod in PERMISSION_MODULES" :key="mod.id" class="border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
                <div class="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 font-medium text-slate-700 dark:text-slate-300 text-sm border-b border-slate-200 dark:border-slate-700/50">
                  {{ mod.label }}
                </div>
                <div class="p-4 flex flex-wrap gap-6 bg-white dark:bg-slate-800/30">
                  <label v-for="act in mod.actions" :key="act.id" class="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      :value="`${mod.id}:${act.id}`" 
                      v-model="form.permissions"
                      class="w-4 h-4 text-primary-600 bg-white border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                    >
                    <span class="text-sm text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ act.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 按鈕 -->
          <div class="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">取消</button>
            <button type="submit" :disabled="saving" class="px-4 py-2 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              儲存角色
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useCRUD } from '@/composables/useCRUD'
import { useNotificationStore } from '@/stores/notifications'
import { supabase } from '@/lib/supabase'
import { ShieldPlus, Edit2, Trash2, X, Loader2 } from 'lucide-vue-next'
import DataTable from '@/components/data/DataTable.vue'

interface Role {
  id: string
  name: string
  permissions: string[]
  created_at: string
}

const notify = useNotificationStore()
const { items, loading, total, page, totalPages, fetch } = useCRUD<Role>('roles')

const columns = [
  { key: 'name',        label: '角色名稱' },
  { key: 'permissions', label: '權限設定', sortable: false },
  { key: 'created_at',  label: '建立時間' },
  { key: 'actions',     label: '操作', sortable: false }
]

const PERMISSION_MODULES = [
  { 
    id: 'dashboard', 
    label: '儀表板', 
    actions: [{ id: 'view', label: '瀏覽' }] 
  },
  { 
    id: 'profile', 
    label: '個人資料', 
    actions: [{ id: 'view', label: '瀏覽' }, { id: 'edit', label: '編輯' }] 
  },
  { 
    id: 'users', 
    label: '用戶管理', 
    actions: [
      { id: 'view', label: '瀏覽' }, 
      { id: 'create', label: '新增' }, 
      { id: 'edit', label: '編輯' }, 
      { id: 'delete', label: '刪除' }
    ] 
  },
  { 
    id: 'roles', 
    label: '角色管理', 
    actions: [
      { id: 'view', label: '瀏覽' }, 
      { id: 'create', label: '新增' }, 
      { id: 'edit', label: '編輯' }, 
      { id: 'delete', label: '刪除' }
    ] 
  },
  { 
    id: 'settings', 
    label: '系統設定', 
    actions: [{ id: 'view', label: '瀏覽' }, { id: 'edit', label: '編輯' }] 
  },
  { 
    id: 'customers', 
    label: '客戶管理', 
    actions: [
      { id: 'view', label: '瀏覽' }, 
      { id: 'create', label: '新增' }, 
      { id: 'edit', label: '編輯' }, 
      { id: 'delete', label: '刪除' }
    ] 
  },
  { 
    id: 'contracts', 
    label: '合約與文件', 
    actions: [
      { id: 'view', label: '瀏覽' }, 
      { id: 'create', label: '新增' }, 
      { id: 'edit', label: '編輯' }, 
      { id: 'delete', label: '刪除' }
    ] 
  },
  { 
    id: 'tickets', 
    label: '客服派單', 
    actions: [
      { id: 'view', label: '瀏覽' }, 
      { id: 'create', label: '新增' }, 
      { id: 'edit', label: '編輯' }, 
      { id: 'delete', label: '刪除' }
    ] 
  }
]

function formatPermission(val: string) {
  if (val === 'all') return '全部權限'
  const [modId, actId] = val.split(':')
  const mod = PERMISSION_MODULES.find(m => m.id === modId)
  if (!mod) return val
  const act = mod.actions.find(a => a.id === actId)
  return `${mod.label} - ${act ? act.label : actId}`
}

let currentSearch = '', currentSort = { col: 'created_at', asc: false }

onMounted(loadData)

async function loadData() {
  await fetch({ search: currentSearch, searchCols: ['name'], orderCol: currentSort.col, ascending: currentSort.asc })
}

function onSearch(q: string) { currentSearch = q; page.value = 1; loadData() }
function onSort(s: { col: string; asc: boolean }) { currentSort = s; loadData() }
function onPageChange(p: number) { page.value = p; loadData() }

// ── Modal 與表單邏輯 ─────────────────────────────────────────────
const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const form = reactive({
  id: '',
  name: '',
  permissions: [] as string[]
})

function openModal(role?: Role) {
  if (role) {
    isEditing.value = true
    form.id = role.id
    form.name = role.name
    form.permissions = [...role.permissions]
  } else {
    isEditing.value = false
    form.id = ''
    form.name = ''
    form.permissions = []
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function saveRole() {
  saving.value = true
  
  try {
    if (isEditing.value) {
      const { error } = await supabase
        .from('roles')
        .update({ name: form.name, permissions: form.permissions })
        .eq('id', form.id)
      if (error) throw error
      notify.success(`已更新角色「${form.name}」`, '更新成功')
    } else {
      const { error } = await supabase
        .from('roles')
        .insert({ name: form.name, permissions: form.permissions })
      if (error) throw error
      notify.success(`已建立新角色「${form.name}」`, '建立成功')
    }
    
    closeModal()
    loadData()
  } catch (err: any) {
    notify.error(err.message || '儲存失敗', '錯誤')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(role: Role) {
  if (!confirm(`確定要刪除角色「${role.name}」嗎？\n\n注意：刪除後，已指派此角色的用戶將失去對應權限。`)) return
  const { error } = await supabase.from('roles').delete().eq('id', role.id)
  if (error) {
    notify.error(error.message, '刪除失敗')
  } else {
    notify.success(`已刪除角色「${role.name}」`)
    loadData()
  }
}
</script>
