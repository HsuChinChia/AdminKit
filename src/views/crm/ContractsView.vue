<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText class="w-7 h-7 text-primary-500" />
          合約與文件
        </h1>
        <p class="text-slate-500 text-sm mt-1">管理報價單、正式合約與相關歷史檔案</p>
      </div>
      <button 
        v-if="auth.hasPermission('contracts:create')"
        @click="openModal()" 
        class="btn-primary flex items-center gap-2"
      >
        <Plus class="w-4 h-4" /> 新增文件
      </button>
    </div>

    <!-- Data Table -->
    <DataTable 
      :columns="columns" 
      :rows="contracts" 
      :loading="loading"
      :total="total"
      :current-page="page"
      :total-pages="totalPages"
      @page-change="onPageChange"
      @sort="onSort"
    >
      <template #cell-title="{ row }">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800 dark:text-slate-200">{{ row.title }}</span>
          <span class="text-xs text-slate-500">{{ getTypeLabel(row.type) }}</span>
        </div>
      </template>

      <template #cell-customer="{ row }">
        <span class="flex items-center gap-1"><Building class="w-3.5 h-3.5 text-slate-400" /> {{ row.customer?.name || '-' }}</span>
      </template>

      <template #cell-amount="{ value }">
        <span class="font-semibold text-slate-600 dark:text-slate-300">
          {{ value ? `NT$ ${Number(value).toLocaleString()}` : '-' }}
        </span>
      </template>

      <template #cell-status="{ value }">
        <span class="badge" :class="getStatusBadge(String(value))">{{ getStatusLabel(String(value)) }}</span>
      </template>

      <template #cell-valid_until="{ value }">
        <span :class="getDateColor(String(value))">{{ value ? new Date(String(value)).toLocaleDateString('zh-TW') : '-' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <button 
            v-if="row.file_path"
            @click.stop="openPreview(row.file_path)"
            class="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="預覽文件"
          >
            <Loader2 v-if="loadingPreview === row.file_path" class="w-4 h-4 animate-spin" />
            <Eye v-else class="w-4 h-4" />
          </button>
          <button 
            v-if="auth.hasPermission('contracts:edit')"
            @click.stop="openModal(row)"
            class="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
            title="編輯文件"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button 
            v-if="auth.hasPermission('contracts:delete')"
            @click.stop="confirmDelete(row.id, row.title)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            title="刪除文件"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">{{ isEditing ? '編輯文件' : '新增報價單/合約' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <X class="w-5 h-5"/>
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="saveContract" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">文件名稱 <span class="text-red-500">*</span></label>
                <input v-model="form.title" type="text" required class="input w-full" placeholder="例如：2024Q1 系統開發報價單" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">關聯客戶 <span class="text-red-500">*</span></label>
                <select v-model="form.customer_id" required class="input w-full cursor-pointer">
                  <option value="" disabled>請選擇客戶</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">文件類型</label>
                <select v-model="form.type" class="input w-full cursor-pointer">
                  <option value="quote">報價單</option>
                  <option value="contract">合約書</option>
                  <option value="other">其他文件</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">狀態</label>
                <select v-model="form.status" class="input w-full cursor-pointer">
                  <option value="draft">草稿</option>
                  <option value="sent">已發送</option>
                  <option value="signed">已簽署 / 成交</option>
                  <option value="expired">已過期</option>
                  <option value="cancelled">已作廢 / 拒絕</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">金額 (NT$)</label>
                <input v-model.number="form.amount" type="number" class="input w-full" placeholder="0" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">到期日 / 有效期限</label>
                <input v-model="form.valid_until" type="date" class="input w-full" />
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 mt-6">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">夾帶檔案上傳 (Storage)</label>
              <FileUpload 
                bucket="documents"
                :user-id="auth.user?.id || 'unknown'"
                :current-url="form.file_path"
                @update:url="onFileUploaded"
                @remove="onFileRemoved"
                :accepted-types="['PDF', 'PNG', 'JPG', 'DOCX']"
              />
            </div>

            <!-- 隱藏的按鈕供表單送出擷取 -->
            <button type="submit" ref="submitBtn" class="hidden"></button>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/50">
          <button @click="closeModal" class="btn-secondary px-5">取消</button>
          <button @click="triggerSubmit" :disabled="saving" class="btn-primary px-5 flex items-center gap-2">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ isEditing ? '儲存修改' : '建立文件' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="isPreviewOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div class="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText class="w-5 h-5 text-primary-500" />
            文件預覽
          </h3>
          <div class="flex items-center gap-2">
            <a :href="previewUrl" target="_blank" class="btn-sm btn-ghost text-primary-600 dark:text-primary-400 flex items-center mr-2">
              <ExternalLink class="w-4 h-4 mr-1" /> 原視窗開啟
            </a>
            <button @click="isPreviewOpen = false" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div class="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center p-2 md:p-6">
          <iframe v-if="previewType === 'pdf'" :src="previewUrl" class="w-full h-full rounded shadow-sm border border-slate-200 dark:border-slate-800"></iframe>
          <img v-else :src="previewUrl" class="max-w-full max-h-full object-contain rounded drop-shadow-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCRUD } from '@/composables/useCRUD'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { FileText, Plus, Edit2, Trash2, X, Loader2, Building, ExternalLink, Eye } from 'lucide-vue-next'
import DataTable from '@/components/data/DataTable.vue'
import FileUpload from '@/components/common/FileUpload.vue'

interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
}

const auth = useAuthStore()
const notify = useNotificationStore()

// CRM Table Setup
const { 
  items: contracts, loading, total, page, totalPages, setPage, fetch, create, update, remove 
} = useCRUD<any>('contracts', {
  select: '*, customer:customers(name)',
  defaultOrder: { column: 'created_at', ascending: false }
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref('')

// Preview Logic
const isPreviewOpen = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const loadingPreview = ref<string | null>(null)

async function openPreview(path: string) {
  if (path.startsWith('http')) {
    // Legacy public URL
    previewUrl.value = path
    previewType.value = path.toLowerCase().includes('.pdf') ? 'pdf' : 'img'
    isPreviewOpen.value = true
    return
  }
  
  // Fetch signed URL for private bucket
  loadingPreview.value = path
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 300) // 5 minutes validity
  loadingPreview.value = null
  
  if (error || !data) {
    notify.error('無法取得文件授權', error?.message)
    return
  }

  previewUrl.value = data.signedUrl
  previewType.value = data.signedUrl.toLowerCase().includes('.pdf') ? 'pdf' : 'img'
  isPreviewOpen.value = true
}

// Columns configuration
const columns = computed<ColumnDef[]>(() => {
  const cols: ColumnDef[] = [
    { key: 'title', label: '文件名稱', sortable: true },
    { key: 'customer', label: '客戶', sortable: false },
    { key: 'amount', label: '金額', sortable: true },
    { key: 'status', label: '狀態', sortable: true },
    { key: 'valid_until', label: '有效期限', sortable: true },
  ]
  if (auth.hasPermission('contracts:edit') || auth.hasPermission('contracts:delete')) {
    cols.push({ key: 'actions', label: '操作', sortable: false })
  }
  return cols
})

// Data references
const customers = ref<any[]>([])
const submitBtn = ref<HTMLButtonElement | null>(null)

// Form State
const form = reactive({
  title: '',
  type: 'quote',
  status: 'draft',
  amount: null as number | null,
  customer_id: '',
  valid_until: '',
  file_path: ''
})

onMounted(async () => {
  if (auth.hasPermission('contracts:view')) {
    fetch()
    loadCustomers()
  } else {
    notify.error('您沒有瀏覽合約的權限')
  }
})

function onSort(payload: { col: string; asc: boolean }) {
  fetch({ orderCol: payload.col, ascending: payload.asc })
}

function onPageChange(p: number) {
  setPage(p)
  fetch()
}

async function loadCustomers() {
  const { data } = await supabase.from('customers').select('id, name').order('name')
  if (data) customers.value = data
}

function openModal(row?: any) {
  if (row) {
    isEditing.value = true
    currentId.value = row.id
    form.title = row.title
    form.type = row.type
    form.status = row.status
    form.amount = row.amount
    form.customer_id = row.customer_id
    form.file_path = row.file_path || ''
    form.valid_until = row.valid_until ? row.valid_until.split('T')[0] : ''
  } else {
    isEditing.value = false
    currentId.value = ''
    form.title = ''
    form.type = 'quote'
    form.status = 'draft'
    form.amount = null
    form.customer_id = ''
    form.valid_until = ''
    form.file_path = ''
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function triggerSubmit() {
  submitBtn.value?.click()
}

async function saveContract() {
  saving.value = true
  const payload = {
    title: form.title,
    type: form.type,
    status: form.status,
    amount: form.amount,
    customer_id: form.customer_id,
    valid_until: form.valid_until || null,
    file_path: form.file_path || null,
    owner_id: auth.user?.id
  }

  const { error } = isEditing.value
    ? await update(currentId.value, payload)
    : await create(payload)
  
  saving.value = false
  if (!error) {
    notify.success(isEditing.value ? '已更新資料' : '建立成功')
    isModalOpen.value = false
    fetch()
  } else {
    notify.error('儲存失敗', error.message)
  }
}

async function confirmDelete(id: string, name: string) {
  if (confirm(`確定刪除文件 "${name}" 嗎？此操作無法還原。`)) {
    const { error } = await remove(id)
    if (!error) {
      notify.success('文件已刪除')
      fetch()
    } else {
      notify.error('刪除失敗', error.message)
    }
  }
}

// File Upload Handlers
function onFileUploaded(url: string) {
  form.file_path = url
}
function onFileRemoved() {
  form.file_path = ''
}

// Helpers
function getTypeLabel(t: string) {
  const map: Record<string, string> = { quote: '報價單', contract: '合約書', other: '其他' }
  return map[t] || t
}
function getStatusLabel(s: string) {
  const map: Record<string, string> = { draft: '草稿', sent: '已發送', signed: '已成單/簽署', expired: '已過期', cancelled: '已作廢' }
  return map[s] || s
}
function getStatusBadge(s: string) {
  const map: Record<string, string> = { 
    draft: 'badge-default', 
    sent: 'badge-info', 
    signed: 'badge-success', 
    expired: 'badge-warning', 
    cancelled: 'badge-danger' 
  }
  return `badge ${map[s] || 'badge-default'}`
}
function getDateColor(dStr: string) {
  if (!dStr || dStr === 'null') return 'text-slate-500'
  const d = new Date(dStr).getTime()
  const today = new Date().setHours(0,0,0,0)
  if (d < today) return 'text-red-500 font-medium'
  return 'text-slate-600 dark:text-slate-300'
}
</script>
