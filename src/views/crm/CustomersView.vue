<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">客戶管理</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">管理公司客戶名單與聯絡窗口</p>
      </div>
      <button 
        v-if="auth.hasPermission('customers:create')"
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <Building class="w-4 h-4" />
        新增客戶
      </button>
    </div>

    <DataTable
      :columns="columns"
      :rows="(items as any[])"
      :loading="loading"
      :total="total"
      :current-page="page"
      :total-pages="totalPages()"
      search-placeholder="搜尋客戶名稱或統編..."
      @search="onSearch"
      @sort="onSort"
      @page-change="onPageChange"
      @row-click="goToDetail"
    >
      <template #cell-created_at="{ value }">
        {{ value ? new Date(String(value)).toLocaleDateString('zh-TW') : '-' }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <button 
            v-if="auth.hasPermission('customers:edit')"
            @click.stop="openModal(row)"
            class="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
            title="編輯客戶"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button 
            v-if="auth.hasPermission('customers:delete')"
            @click.stop="confirmDelete(row.id, row.name)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            title="刪除客戶"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- 新增 / 編輯 Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">{{ isEditing ? '編輯客戶' : '新增客戶' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveCustomer" class="p-6 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              公司 / 客戶名稱 <span class="text-red-500">*</span>
            </label>
            <input v-model="form.name" type="text" required class="input" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">統一編號</label>
              <input v-model="form.tax_id" type="text" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">產業類別</label>
              <input v-model="form.industry" type="text" class="input" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">官方網站</label>
            <input v-model="form.website" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">聯絡地址</label>
            <input v-model="form.address" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">備註</label>
            <textarea v-model="form.notes" rows="3" class="input"></textarea>
          </div>
          
          <div class="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" @click="closeModal" class="btn-secondary">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary flex items-center gap-2">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCRUD } from '@/composables/useCRUD'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { Building, Edit2, Trash2, X, Loader2 } from 'lucide-vue-next'
import DataTable from '@/components/data/DataTable.vue'

interface Customer {
  id: string
  name: string
  tax_id: string
  industry: string
  website: string
  address: string
  notes: string
  created_at: string
}

interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
}

const router = useRouter()
const auth   = useAuthStore()
const notify = useNotificationStore()
const { items, loading, total, page, totalPages, setPage, fetch, create, update, remove } = useCRUD<Customer>('customers')

const columns = computed<ColumnDef[]>(() => {
  const cols: ColumnDef[] = [
    { key: 'name',     label: '客戶名稱' },
    { key: 'tax_id',   label: '統編' },
    { key: 'industry', label: '產業類別' },
    { key: 'created_at', label: '建立時間' },
  ]
  if (auth.hasPermission('customers:edit') || auth.hasPermission('customers:delete')) {
    cols.push({ key: 'actions', label: '操作', sortable: false })
  }
  return cols
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref('')

const form = reactive({
  name: '', tax_id: '', industry: '', website: '', address: '', notes: ''
})

function onSearch(query: string) {
  fetch({ search: query, searchCols: ['name', 'tax_id'] })
}

function onSort(payload: { col: string; asc: boolean }) {
  fetch({ orderCol: payload.col, ascending: payload.asc })
}

function onPageChange(p: number) {
  setPage(p)
  fetch()
}

onMounted(() => {
  if (!auth.hasPermission('customers:view')) {
    notify.error('權限不足', '您沒有瀏覽客戶管理的權限')
    router.push('/dashboard')
    return
  }
  fetch({ orderCol: 'created_at', ascending: false })
})

function goToDetail(row: Customer) {
  router.push(`/crm/customers/${row.id}`)
}

function openModal(item?: Customer) {
  isEditing.value = !!item
  if (item) {
    currentId.value = item.id
    form.name = item.name || ''
    form.tax_id = item.tax_id || ''
    form.industry = item.industry || ''
    form.website = item.website || ''
    form.address = item.address || ''
    form.notes = item.notes || ''
  } else {
    currentId.value = ''
    form.name = ''
    form.tax_id = ''
    form.industry = ''
    form.website = ''
    form.address = ''
    form.notes = ''
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function saveCustomer() {
  saving.value = true
  try {
    if (isEditing.value) {
      const { error } = await update(currentId.value, { ...form })
      if (error) throw error
      notify.success('更新成功')
    } else {
      const { error } = await create({ ...form, owner_id: auth.user?.id } as Partial<Customer> & { owner_id?: string })
      if (error) throw error
      notify.success('新增成功')
    }
    closeModal()
    fetch({ orderCol: 'created_at', ascending: false })
  } catch (err: any) {
    notify.error('儲存失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string, name: string) {
  if (!confirm(`確定要刪除客戶 "${name}" 嗎？\n⚠️ 此操作無法復原，且會連帶刪除所有關聯資料 (聯絡人、商機等)。`)) return
  try {
    const { error } = await remove(id)
    if (error) throw error
    notify.success('客戶已刪除')
    fetch({ orderCol: 'created_at', ascending: false })
  } catch (err: any) {
    notify.error('刪除失敗', err.message)
  }
}
</script>
