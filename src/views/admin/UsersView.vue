<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">用戶管理</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">管理所有系統用戶（Admin 專屬）</p>
      </div>
      <RouterLink 
        v-if="auth.hasPermission('users:create')"
        to="/admin/users/create"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <UserPlus class="w-4 h-4" />
        新增用戶
      </RouterLink>
    </div>

    <DataTable
      :columns="columns"
      :rows="(items as any[])"
      :loading="loading"
      :total="total"
      :current-page="page"
      :total-pages="totalPages"
      search-placeholder="搜尋用戶名稱..."
      @search="onSearch"
      @sort="onSort"
      @page-change="onPageChange"
    >
      <template #cell-role="{ row }">
        <span class="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-medium">
          {{ row.roles?.name || '未指派' }}
        </span>
      </template>
      <template #cell-gender="{ value }">
        <span v-if="value === 'male'" class="text-blue-600 dark:text-blue-400">男</span>
        <span v-else-if="value === 'female'" class="text-pink-600 dark:text-pink-400">女</span>
        <span v-else class="text-slate-400">-</span>
      </template>
      <template #cell-created_at="{ value }">
        {{ value ? new Date(String(value)).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '-' }}
      </template>
      <template #cell-actions="{ row }">
        <button 
          v-if="auth.hasPermission('users:edit')"
          @click="openEditModal(row)"
          class="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
          title="編輯用戶"
        >
          <Edit2 class="w-4 h-4" />
        </button>
      </template>
    </DataTable>

    <!-- 編輯用戶 Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">編輯用戶資料</h3>
          <button @click="closeEditModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveUserChanges" class="p-6 space-y-4">
          <!-- 用戶名稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">用戶名稱</label>
            <input v-model="editingUser.username" type="text" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50" />
          </div>
          
          <!-- 電話 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">電話號碼</label>
            <input v-model="editingUser.phone" type="text" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50" />
          </div>
          
          <!-- 性別 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">性別</label>
            <select v-model="editingUser.gender" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50">
              <option value="">未指定</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          
          <!-- 角色 -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">角色權限</label>
            <select v-model="editingUser.role_id" required class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50">
              <option value="" disabled>請選擇角色</option>
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
          
          <!-- 按鈕 -->
          <div class="pt-4 flex justify-end gap-3">
            <button type="button" @click="closeEditModal" class="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">取消</button>
            <button type="submit" :disabled="saving" class="px-4 py-2 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useCRUD }       from '@/composables/useCRUD'
import { useRealtime }   from '@/composables/useRealtime'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { UserPlus, Edit2, X, Loader2 } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/data/DataTable.vue'

interface Profile { 
  id: string
  username: string | null
  phone?: string | null
  gender?: string | null
  role_id: string | null
  roles?: { name: string } | null
  created_at: string 
}

const auth = useAuthStore()
const notify = useNotificationStore()
const { items, loading, total, page, totalPages, fetch } = useCRUD<Profile>('profiles', {
  select: '*, roles:role_id(name)'
})

const columns = computed(() => {
  const cols: { key: string; label: string; sortable?: boolean }[] = [
    { key: 'username',   label: '用戶名稱' },
    { key: 'role',       label: '角色' },
    { key: 'phone',      label: '電話' },
    { key: 'gender',     label: '性別' },
    { key: 'created_at', label: '加入時間' },
  ]
  if (auth.hasPermission('users:edit') || auth.hasPermission('users:delete')) {
    cols.push({ key: 'actions', label: '操作', sortable: false })
  }
  return cols
})

let currentSearch = '', currentSort = { col: 'created_at', asc: false }

useRealtime<Profile>('profiles', {
  onInsert: (row) => { notify.info(`${row.username || '新用戶'} 加入系統`, '🔔 新用戶'); loadData() },
  onUpdate: () => loadData(),
  onDelete: () => loadData(),
})

const availableRoles = ref<{ id: string, name: string }[]>([])

onMounted(async () => {
  loadData()
  const { data } = await supabase.from('roles').select('id, name').order('created_at', { ascending: true })
  if (data) availableRoles.value = data
})

async function loadData() {
  await fetch({ search: currentSearch, searchCols: ['username'], orderCol: currentSort.col, ascending: currentSort.asc })
}

function onSearch(q: string) { currentSearch = q; page.value = 1; loadData() }
function onSort(s: { col: string; asc: boolean }) { currentSort = s; loadData() }
function onPageChange(p: number) { page.value = p; loadData() }

// ── 編輯用戶邏輯 ─────────────────────────────────────────────
const isEditModalOpen = ref(false)
const saving = ref(false)
const editingUser = reactive<Partial<Profile>>({})

function openEditModal(user: Profile) {
  Object.assign(editingUser, user) // 複製資料到表單
  isEditModalOpen.value = true
}

function closeEditModal() {
  isEditModalOpen.value = false
}

async function saveUserChanges() {
  if (!editingUser.id) return
  saving.value = true
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('未登入')

    const { data, error } = await supabase.functions.invoke('update-user', {
      body: {
        id: editingUser.id,
        username: editingUser.username,
        role_id: editingUser.role_id,
        phone: editingUser.phone,
        gender: editingUser.gender
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
      
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    
    notify.success('更新成功', '用戶資料已儲存')
    closeEditModal()
    loadData() // 重新載入列表
  } catch (err: any) {
    notify.error(err.message, '更新失敗')
  } finally {
    saving.value = false
  }
}
</script>
