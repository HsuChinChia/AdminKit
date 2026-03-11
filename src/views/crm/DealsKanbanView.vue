<template>
  <div class="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4 shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">銷售漏斗看板</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">拖曳卡片以變更商機階段</p>
      </div>
      <button 
        v-if="auth.hasPermission('deals:create')"
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <Plus class="w-4 h-4" />
        新增商機
      </button>
    </div>

    <!-- Kanban Board -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <div v-else class="flex h-full gap-4 min-w-max items-start">
        <!-- Stages Columns -->
        <div 
          v-for="stage in stages" 
          :key="stage.id"
          class="flex flex-col w-80 max-h-full bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
          @dragover.prevent
          @dragenter.prevent="dragHoverStage = stage.id"
          @dragleave.prevent="dragHoverStage = null"
          @drop="onDrop($event, stage.id)"
          :class="{ 'ring-2 ring-primary-500/50 bg-primary-50/50 dark:bg-primary-900/20': dragHoverStage === stage.id }"
        >
          <!-- Stage Header -->
          <div class="p-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-100/50 dark:bg-slate-800 shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" :class="stage.colorClass"></div>
              <h3 class="font-semibold text-slate-700 dark:text-slate-200 text-sm">{{ stage.label }}</h3>
            </div>
            <span class="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full font-medium shadow-sm">
              {{ formatCurrency(getStageTotal(stage.id)) }}
            </span>
          </div>

          <!-- Cards Container -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            <div 
              v-for="deal in getDealsByStage(stage.id)" 
              :key="deal.id"
              class="bg-white dark:bg-surface-dark-muted p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group"
              draggable="true"
              @dragstart="onDragStart($event, deal)"
              @dragend="dragHoverStage = null"
              @click="openModal(deal)"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-slate-800 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ deal.title }}
                </h4>
                <button 
                  v-if="auth.hasPermission('deals:delete')"
                  @click.stop="deleteDeal(deal.id)" 
                  class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 -mt-1 rounded"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div class="flex items-center justify-between mt-3 text-xs">
                <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Building class="w-3.5 h-3.5" />
                  <span class="truncate max-w-[120px]">{{ deal.customer?.name || '未知客戶' }}</span>
                </div>
              </div>
              
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span class="font-semibold text-slate-700 dark:text-slate-200">
                  {{ formatCurrency(deal.amount || 0) }}
                </span>
                <span class="text-slate-500" :class="getProbabilityColor(deal.probability || 0)">
                  {{ deal.probability || 0 }}% 機率
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 編輯 / 新增 Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
            {{ isEditing ? '編輯商機' : '新增商機' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveDeal" class="p-6 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              商機名稱 <span class="text-red-500">*</span>
            </label>
            <input v-model="form.title" type="text" required class="input" placeholder="例如：2024 Q4 系統升級專案" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              關聯客戶 <span class="text-red-500">*</span>
            </label>
            <select v-model="form.customer_id" required class="input appearance-none bg-white dark:bg-slate-800 cursor-pointer">
              <option value="" disabled>請選擇客戶...</option>
              <option v-for="c in customersList" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">預估金額 (NT$)</label>
              <input v-model.number="form.amount" type="number" min="0" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">成功機率 (%)</label>
              <input v-model.number="form.probability" type="number" min="0" max="100" class="input" />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">目前階段</label>
              <select v-model="form.stage" class="input appearance-none bg-white dark:bg-slate-800 cursor-pointer">
                <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">預計結案日</label>
              <input v-model="form.expected_close_date" type="date" class="input" />
            </div>
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
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { Plus, Building, Trash2, X, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const auth   = useAuthStore()
const notify = useNotificationStore()

// ── Types ───────────────────────────────────────────────────
interface Deal {
  id: string
  title: string
  customer_id: string
  amount: number
  probability: number
  expected_close_date: string | null
  stage: string
  notes: string
  customer?: { name: string }
}

const stages = [
  { id: 'new',       label: '初步接觸', colorClass: 'bg-blue-500' },
  { id: 'qualified', label: '需求確認', colorClass: 'bg-indigo-500' },
  { id: 'proposal',  label: '簡報/報價中', colorClass: 'bg-amber-500' },
  { id: 'won',       label: '贏得訂單', colorClass: 'bg-emerald-500' },
  { id: 'lost',      label: '輸單/放棄', colorClass: 'bg-red-500' },
]

// ── State ───────────────────────────────────────────────────
const deals = ref<Deal[]>([])
const customersList = ref<{id: string, name: string}[]>([])
const loading = ref(true)
const saving = ref(false)
const dragHoverStage = ref<string | null>(null)

const isModalOpen = ref(false)
const isEditing = ref(false)
const currentId = ref('')
const form = reactive({
  title: '', customer_id: '', amount: 0, probability: 50, stage: 'new', expected_close_date: '', notes: ''
})

// ── Fetching Data ───────────────────────────────────────────
async function fetchData() {
  loading.value = true
  try {
    const { data: dData, error: dErr } = await supabase
      .from('deals')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })
    
    if (dErr) throw dErr
    deals.value = dData as Deal[]

    const { data: cData, error: cErr } = await supabase
      .from('customers')
      .select('id, name')
      .order('name')

    if (cErr) throw cErr
    customersList.value = cData || []
  } catch (err: any) {
    notify.error('載入失敗', err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!auth.hasPermission('deals:view')) {
    notify.error('權限不足', '您沒有存取商機管理的權限')
    router.push('/dashboard')
    return
  }
  fetchData()
})

// ── Kanban Logic ────────────────────────────────────────────
function getDealsByStage(stageId: string) {
  return deals.value.filter(d => d.stage === stageId)
}

function getStageTotal(stageId: string) {
  return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.amount || 0), 0)
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(val)
}

function getProbabilityColor(prob: number) {
  if (prob >= 80) return 'text-emerald-500 font-medium'
  if (prob >= 50) return 'text-amber-500'
  return 'text-red-400'
}

// Drag & Drop
function onDragStart(event: DragEvent, deal: Deal) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('dealId', deal.id)
  }
}

async function onDrop(event: DragEvent, toStageId: string) {
  dragHoverStage.value = null
  const dealId = event.dataTransfer?.getData('dealId')
  if (!dealId) return
  
  const dealIndex = deals.value.findIndex(d => d.id === dealId)
  if (dealIndex === -1) return
  
  const oldStage = deals.value[dealIndex]?.stage
  if (!oldStage || oldStage === toStageId) return

  // Optimistic UI update
  const deal = deals.value[dealIndex]
  if (deal) deal.stage = toStageId

  try {
    const { error } = await supabase
      .from('deals')
      .update({ stage: toStageId })
      .eq('id', dealId)
    
    if (error) throw error
  } catch (err: any) {
    // Revert on error
    const deal = deals.value[dealIndex]
    if (deal && oldStage) deal.stage = oldStage
    notify.error('移動失敗', err.message)
  }
}

// ── Modal & CRUD Logic ──────────────────────────────────────
function openModal(deal?: Deal) {
  isEditing.value = !!deal
  if (deal) {
    currentId.value = deal.id
    form.title = deal.title
    form.customer_id = deal.customer_id
    form.amount = deal.amount || 0
    form.probability = deal.probability || 0
    form.stage = deal.stage
    form.expected_close_date = deal.expected_close_date || ''
    form.notes = deal.notes || ''
  } else {
    currentId.value = ''
    form.title = ''
    form.customer_id = customersList.value.length ? customersList.value[0]?.id || '' : ''
    form.amount = 0
    form.probability = 50
    form.stage = 'new'
    form.expected_close_date = ''
    form.notes = ''
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function saveDeal() {
  saving.value = true
  try {
    const payload = { 
      ...form, 
      expected_close_date: form.expected_close_date || null // Convert empty string to null
    }

    if (isEditing.value) {
      const { error } = await supabase.from('deals').update(payload).eq('id', currentId.value)
      if (error) throw error
      notify.success('商機已更新')
    } else {
      const { error } = await supabase.from('deals').insert({ ...payload, owner_id: auth.user?.id })
      if (error) throw error
      notify.success('商機建立成功')
    }
    closeModal()
    fetchData()
  } catch (err: any) {
    notify.error('儲存失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function deleteDeal(id: string) {
  if (!confirm('確定要刪除這筆商機嗎？')) return
  try {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) throw error
    deals.value = deals.value.filter(d => d.id !== id)
    notify.success('商機已刪除')
  } catch (err: any) {
    notify.error('刪除失敗', err.message)
  }
}
</script>
