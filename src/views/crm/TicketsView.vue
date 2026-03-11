<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <LifeBuoy class="w-7 h-7 text-primary-500" />
          客服派單與維修
        </h1>
        <p class="text-slate-500 text-sm mt-1">追蹤客戶報修案件、工程派單與維護進度</p>
      </div>
      <button 
        v-if="auth.hasPermission('tickets:create')"
        @click="openModal()" 
        class="btn-primary flex items-center gap-2"
      >
        <Plus class="w-4 h-4" /> 新增案件
      </button>
    </div>

    <!-- Stats Row (Optional) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="card p-4 flex items-center gap-4">
        <div :class="`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`">
          <component :is="stat.icon" :class="`w-5 h-5 ${stat.color}`" />
        </div>
        <div>
          <p class="text-xs text-slate-500 font-medium">{{ stat.label }}</p>
          <p class="text-xl font-bold text-slate-800 dark:text-white">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable 
      :columns="columns" 
      :rows="tickets" 
      :loading="loading"
      :total="total"
      :current-page="page"
      :total-pages="totalPages"
      @page-change="onPageChange"
      @sort="onSort"
    >
      <template #cell-subject="{ row }">
        <div class="flex flex-col">
          <span class="font-medium text-slate-800 dark:text-slate-200">{{ row.subject }}</span>
          <span class="text-xs text-slate-500 truncate max-w-[200px]">{{ row.description || '無詳細描述' }}</span>
        </div>
      </template>

      <template #cell-customer="{ row }">
        <div class="flex flex-col">
          <span class="text-sm">{{ row.customer?.name || '-' }}</span>
          <span v-if="row.contact" class="text-[10px] text-slate-400 flex items-center gap-0.5">
            <UserIcon class="w-2.5 h-2.5" /> {{ row.contact.name }}
          </span>
        </div>
      </template>

      <template #cell-priority="{ value }">
        <span class="flex items-center gap-1.5">
          <span :class="`w-2 h-2 rounded-full ${getPriorityColor(String(value))}`"></span>
          {{ getPriorityLabel(String(value)) }}
        </span>
      </template>

      <template #cell-status="{ value }">
        <span class="badge" :class="getStatusBadge(String(value))">{{ getStatusLabel(String(value)) }}</span>
      </template>

      <template #cell-assignee="{ row }">
        <div class="flex items-center gap-2" v-if="row.assignee">
          <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
            {{ row.assignee.username?.charAt(0).toUpperCase() || '?' }}
          </div>
          <span class="text-sm">{{ row.assignee.username || '未具名' }}</span>
        </div>
        <span v-else class="text-slate-400 text-xs italic">尚未指派</span>
      </template>

      <template #cell-created_at="{ value }">
        <span class="text-slate-500">{{ new Date(String(value)).toLocaleDateString('zh-TW') }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-1">
          <button 
            v-if="auth.hasPermission('tickets:edit')"
            @click.stop="openModal(row)"
            class="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
            title="編輯案件"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button 
            v-if="auth.hasPermission('tickets:delete')"
            @click.stop="confirmDelete(row.id, row.subject)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            title="刪除"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal Form -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">{{ isEditing ? '編輯案件資訊' : '建立新維修案件' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <X class="w-5 h-5"/>
          </button>
        </div>

        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="saveTicket" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">主旨 / 故障簡述 <span class="text-red-500">*</span></label>
                <input v-model="form.subject" type="text" required class="input w-full" placeholder="例如：1F 飲水機漏水" />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">詳細描述</label>
                <textarea v-model="form.description" class="input w-full h-24 pt-2" placeholder="詳細描述現場狀況..."></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">關聯客戶 <span class="text-red-500">*</span></label>
                <select v-model="form.customer_id" required class="input w-full cursor-pointer" @change="onCustomerChange">
                  <option value="" disabled>請選擇客戶</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">聯絡人 (選填)</label>
                <select v-model="form.contact_id" class="input w-full cursor-pointer">
                  <option value="">-- 無 --</option>
                  <option v-for="con in contacts" :key="con.id" :value="con.id">{{ con.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">優先順序</label>
                <select v-model="form.priority" class="input w-full cursor-pointer">
                  <option value="low">低 (一般)</option>
                  <option value="medium">中 (優先)</option>
                  <option value="high">高 (緊急)</option>
                  <option value="urgent">極緊急 (特急)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">當前狀態</label>
                <select v-model="form.status" class="input w-full cursor-pointer">
                  <option value="open">新案件 (未處理)</option>
                  <option value="in_progress">進行中</option>
                  <option value="resolved">已解決 (待驗收)</option>
                  <option value="closed">已結案</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">指派人員</label>
                <select v-model="form.assignee_id" class="input w-full cursor-pointer">
                  <option value="">-- 尚未指派 --</option>
                  <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.username || p.email }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">結案時間</label>
                <input v-model="form.resolved_at" type="date" class="input w-full" :disabled="form.status !== 'resolved' && form.status !== 'closed'" />
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Camera class="w-4 h-4" /> 現場狀況照片 (Storage)
              </label>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" v-if="form.image_paths.length > 0">
                <div v-for="(path, idx) in form.image_paths" :key="path" class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <img :src="getSignedImageUrl(path)" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button @click.prevent="openImagePreview(path)" class="p-1.5 bg-white rounded-full text-slate-800 hover:scale-110 transition-transform"><Maximize2 class="w-3.5 h-3.5" /></button>
                    <button @click.prevent="removeImage(idx)" class="p-1.5 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"><X class="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>

              <FileUpload 
                bucket="tickets"
                :user-id="auth.user?.id || 'unknown'"
                @update:url="onImageUploaded"
                :accepted-types="['PNG', 'JPG', 'JPEG']"
              />
              <p class="text-[10px] text-slate-400 mt-2">* 支援批次上傳（多次上傳可累加圖片）</p>
            </div>

            <button type="submit" ref="submitBtn" class="hidden"></button>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800/50">
          <button @click="closeModal" class="btn-secondary px-5">取消</button>
          <button @click="triggerSubmit" :disabled="saving" class="btn-primary px-5 flex items-center gap-2">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ isEditing ? '儲存變更' : '建立案單' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Preview Overray -->
    <div v-if="previewingImage" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" @click="previewingImage = null">
      <img :src="getSignedImageUrl(previewingImage)" class="max-w-full max-h-full object-contain shadow-2xl" />
      <button class="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"><X class="w-6 h-6" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCRUD } from '@/composables/useCRUD'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { 
  LifeBuoy, Plus, Edit2, Trash2, X, Loader2, 
  Building, User as UserIcon, Camera, Maximize2,
  Clock, CheckCircle, AlertTriangle, MessageSquare
} from 'lucide-vue-next'
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
  items: tickets, loading, total, page, totalPages, setPage, fetch, create, update, remove 
} = useCRUD<any>('tickets', {
  select: '*, customer:customers(name), contact:contacts(name), assignee:profiles!tickets_assignee_id_fkey(username)',
  defaultOrder: { column: 'created_at', ascending: false }
})

const columns = computed<ColumnDef[]>(() => [
  { key: 'subject',   label: '案件內容', sortable: true },
  { key: 'customer',  label: '客戶/聯絡人', sortable: false },
  { key: 'priority',  label: '優先順序', sortable: true },
  { key: 'status',    label: '狀態',     sortable: true },
  { key: 'assignee',  label: '指派人員', sortable: false },
  { key: 'created_at', label: '報修日期', sortable: true },
  { key: 'actions',   label: '操作',     sortable: false }
])

// Reference Data
const customers = ref<any[]>([])
const contacts = ref<any[]>([])
const profiles = ref<any[]>([])
const stats = ref([
  { label: '待處理案件', value: '0', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '處理中', value: '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: '本月完修', value: '0', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: '緊急待辦', value: '0', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
])

// Modal State
const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const currentId = ref('')
const submitBtn = ref<HTMLButtonElement | null>(null)
const previewingImage = ref<string | null>(null)
const signedUrls = reactive<Record<string, string>>({})

// Form State
const form = reactive({
  subject: '',
  description: '',
  priority: 'medium',
  status: 'open',
  customer_id: '',
  contact_id: '',
  assignee_id: '',
  resolved_at: '',
  image_paths: [] as string[]
})

onMounted(async () => {
  if (auth.hasPermission('tickets:view')) {
    fetch()
    loadCustomers()
    loadProfiles()
    updateStats()
  } else {
    notify.error('您沒有瀏覽派單的權限')
  }
})

async function updateStats() {
  const { data: counts } = await supabase.from('tickets').select('status, priority')
  if (counts) {
    if (stats.value[0]) stats.value[0].value = counts.filter(t => t.status === 'open').length.toString()
    if (stats.value[1]) stats.value[1].value = counts.filter(t => t.status === 'in_progress').length.toString()
    if (stats.value[2]) stats.value[2].value = counts.filter(t => t.status === 'resolved' || t.status === 'closed').length.toString()
    if (stats.value[3]) stats.value[3].value = counts.filter(t => t.priority === 'urgent' || t.priority === 'high').length.toString()
  }
}

async function loadCustomers() {
  const { data } = await supabase.from('customers').select('id, name').order('name')
  if (data) customers.value = data
}

async function loadProfiles() {
  const { data } = await supabase.from('profiles').select('id, username, email').order('username')
  if (data) profiles.value = data
}

async function onCustomerChange() {
  form.contact_id = ''
  if (!form.customer_id) {
    contacts.value = []
    return
  }
  const { data } = await supabase.from('contacts').select('id, name').eq('customer_id', form.customer_id)
  if (data) contacts.value = data
}

function onPageChange(p: number) {
  setPage(p)
  fetch()
}

function onSort(payload: { col: string; asc: boolean }) {
  fetch({ orderCol: payload.col, ascending: payload.asc })
}

function openModal(row?: any) {
  if (row) {
    isEditing.value = true
    currentId.value = row.id
    form.subject = row.subject
    form.description = row.description || ''
    form.priority = row.priority
    form.status = row.status
    form.customer_id = row.customer_id
    form.contact_id = row.contact_id || ''
    form.assignee_id = row.assignee_id || ''
    form.image_paths = row.image_paths || []
    form.resolved_at = row.resolved_at ? row.resolved_at.split('T')[0] : ''
    onCustomerChange() // 加載該客戶的聯絡人
  } else {
    isEditing.value = false
    currentId.value = ''
    form.subject = ''
    form.description = ''
    form.priority = 'medium'
    form.status = 'open'
    form.customer_id = ''
    form.contact_id = ''
    form.assignee_id = ''
    form.image_paths = []
    form.resolved_at = ''
    contacts.value = []
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function triggerSubmit() {
  submitBtn.value?.click()
}

async function saveTicket() {
  saving.value = true
  const payload = {
    subject: form.subject,
    description: form.description,
    priority: form.priority,
    status: form.status,
    customer_id: form.customer_id,
    contact_id: form.contact_id || null,
    assignee_id: form.assignee_id || null,
    image_paths: form.image_paths,
    creator_id: isEditing.value ? undefined : auth.user?.id,
    resolved_at: (form.status === 'resolved' || form.status === 'closed') && form.resolved_at ? form.resolved_at : null
  }

  const { error } = isEditing.value
    ? await update(currentId.value, payload)
    : await create(payload)
  
  saving.value = false
  if (!error) {
    notify.success(isEditing.value ? '已更新案件資訊' : '建立案單成功')
    isModalOpen.value = false
    fetch()
    updateStats()
  } else {
    notify.error('儲存失敗', error.message)
  }
}

async function confirmDelete(id: string, name: string) {
  if (confirm(`確定刪除案件 "${name}" 嗎？`)) {
    const { error } = await remove(id)
    if (!error) {
      notify.success('案件已刪除')
      fetch()
      updateStats()
    } else {
      notify.error('刪除失敗', error.message)
    }
  }
}

// Image Handling
function onImageUploaded(path: string) {
  form.image_paths.push(path)
  getSignedImageUrl(path) // pre-fetch
}

function removeImage(idx: number) {
  form.image_paths.splice(idx, 1)
}

function getSignedImageUrl(path: string) {
  if (signedUrls[path]) return signedUrls[path]
  
  // Fetch signed URL asynchronously
  supabase.storage.from('tickets').createSignedUrl(path, 3600).then(({ data }) => {
    if (data) signedUrls[path] = data.signedUrl
  })
  
  return '' // Return empty until ready
}

function openImagePreview(path: string) {
  previewingImage.value = path
}

// Helpers
function getPriorityLabel(p: string) {
  const map: any = { low: '普通', medium: '優先', high: '緊急', urgent: '特急' }
  return map[p] || p
}
function getPriorityColor(p: string) {
  const map: any = { low: 'bg-emerald-400', medium: 'bg-blue-400', high: 'bg-amber-400', urgent: 'bg-red-500' }
  return map[p] || 'bg-slate-400'
}
function getStatusLabel(s: string) {
  const map: any = { open: '新案件', in_progress: '處理中', resolved: '已解決', closed: '已結案' }
  return map[s] || s
}
function getStatusBadge(s: string) {
  const map: any = { open: 'badge-info', in_progress: 'badge-warning', resolved: 'badge-success', closed: 'badge-default' }
  return `badge ${map[s] || 'badge-default'}`
}
</script>
