<template>
  <div>
    <div class="space-y-6" v-if="customer">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="router.push('/crm/customers')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building class="w-6 h-6 text-primary-500" />
            {{ customer.name }}
          </h1>
          <p class="text-slate-500 text-sm mt-1">統編：{{ customer.tax_id || '未提供' }} &nbsp;|&nbsp; 產業：{{ customer.industry || '未提供' }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button v-if="auth.hasPermission('customers:edit')" @click="openCustomerEditModal" class="btn-secondary flex items-center gap-2">
          <Edit2 class="w-4 h-4" /> 編輯資料
        </button>
      </div>
    </div>

    <!-- 內容區域 Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      <!-- 主欄 (佔 2 欄)：聯絡人、商機軌跡等 -->
      <div class="xl:col-span-2 space-y-6">
        
        <!-- 聯絡人區塊 -->
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Users class="w-5 h-5 text-primary-500" /> 聯絡人名單
            </h2>
            <button 
              @click="openContactModal()"
              v-if="auth.hasPermission('customers:edit')"
              class="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              + 新增聯絡人
            </button>
          </div>
          <div class="card-body">
            <div v-if="contacts.length === 0" class="text-center py-6 text-slate-400">
              尚無聯絡人紀錄
            </div>
            <div class="space-y-4" v-else>
              <div v-for="contact in contacts" :key="contact.id" class="group p-4 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 flex items-center justify-center font-bold">
                    {{ contact.name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                      {{ contact.name }}
                      <span v-if="contact.is_primary" class="badge badge-success !text-[10px] !px-1.5 !py-0">主要聯絡人</span>
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">{{ contact.title || '無職稱' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-sm text-slate-500">
                  <span v-if="contact.phone" class="flex items-center gap-1"><Phone class="w-3.5 h-3.5" /> {{ contact.phone }}</span>
                  <span v-if="contact.email" class="flex items-center gap-1"><Mail class="w-3.5 h-3.5" /> {{ contact.email }}</span>
                </div>
                <div class="ml-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openContactModal(contact)" v-if="auth.hasPermission('customers:edit')" class="p-1.5 text-slate-400 hover:text-primary-500 rounded" title="編輯">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button @click="deleteContact(contact.id)" v-if="auth.hasPermission('customers:edit')" class="p-1.5 text-slate-400 hover:text-red-500 rounded" title="刪除">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 互動紀錄 (保留給 Module 3: Activities Extensions) -->
        <div class="card">
          <div class="card-header border-b border-surface-border dark:border-surface-dark-border">
            <h2 class="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <ActivityIcon class="w-5 h-5 text-blue-500" /> 歷史互動軌跡
            </h2>
          </div>
          <div class="card-body bg-slate-50/50 dark:bg-slate-900/20 p-6">
            <ActivityTimeline :customer-id="customerId" />
          </div>
        </div>
      </div>

      <!-- 側欄 (佔 1 欄)：詳細資訊、關聯商機等 -->
      <div class="space-y-6">
        <div class="card card-body">
          <h3 class="font-medium text-slate-800 dark:text-white mb-4">系統資訊</h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start justify-between">
              <span class="text-slate-500">官方網站</span>
              <a v-if="customer.website" :href="customer.website" target="_blank" class="text-primary-600 hover:underline max-w-[150px] truncate">{{ customer.website }}</a>
              <span v-else class="text-slate-400">-</span>
            </li>
            <li class="flex items-start justify-between">
              <span class="text-slate-500">地址</span>
              <span class="text-slate-700 dark:text-slate-200 max-w-[150px] text-right break-words">{{ customer.address || '-' }}</span>
            </li>
            <li class="flex items-start justify-between">
              <span class="text-slate-500">建立時間</span>
              <span class="text-slate-700 dark:text-slate-200">{{ new Date(customer.created_at).toLocaleDateString() }}</span>
            </li>
          </ul>
        </div>

        <div class="card card-body">
          <h3 class="font-medium text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-[10px]">💰</span> 關聯商機
          </h3>
          <div v-if="deals.length === 0" class="text-sm text-slate-400 text-center py-4">
            尚無關聯商機
          </div>
          <div class="space-y-3" v-else>
            <div v-for="deal in deals" :key="deal.id" class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-sm group cursor-pointer hover:border-primary-300 transition-colors" @click="router.push('/crm/deals')">
              <div class="flex justify-between mb-1">
                <span class="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{{ deal.title }}</span>
                <span class="font-semibold" :class="getDealProbabilityColor(deal.probability || 0)">{{ deal.probability }}%</span>
              </div>
              <div class="flex justify-between text-slate-500 text-xs">
                <span>{{ getDealStageLabel(deal.stage) }}</span>
                <span>NT$ {{ (deal.amount || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
  
  <div v-else-if="loading" class="flex items-center justify-center py-20">
    <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
  </div>

  <!-- 新增聯絡人 Modal -->
  <div v-if="isContactModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 class="font-semibold text-slate-800 dark:text-white">{{ isContactEditing ? '編輯聯絡人' : '新增聯絡人' }}</h3>
        <button @click="isContactModalOpen = false" class="text-slate-400 hover:text-slate-600"><X class="w-4 h-4"/></button>
      </div>
      <form @submit.prevent="saveContact" class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">姓名 <span class="text-red-500">*</span></label>
          <input v-model="contactForm.name" required class="input w-full" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">職稱</label>
          <input v-model="contactForm.title" class="input w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">電話</label>
            <input v-model="contactForm.phone" class="input w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">信箱</label>
            <input v-model="contactForm.email" type="email" class="input w-full" />
          </div>
        </div>
        <div class="pt-2 flex items-center gap-2">
          <input type="checkbox" id="is_primary" v-model="contactForm.is_primary" class="rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 bg-transparent" />
          <label for="is_primary" class="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">設為主要聯絡人</label>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button type="button" @click="isContactModalOpen = false" class="btn-secondary py-1.5 px-3 text-sm">取消</button>
          <button type="submit" :disabled="saving" class="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />儲存
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- 客戶編輯 Modal -->
  <div v-if="isCustomerModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 class="font-semibold text-slate-800 dark:text-white">編輯客戶資料</h3>
        <button @click="isCustomerModalOpen = false" class="text-slate-400 hover:text-slate-600"><X class="w-4 h-4"/></button>
      </div>
      <form @submit.prevent="saveCustomer" class="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">公司名稱 <span class="text-red-500">*</span></label>
          <input v-model="customerForm.name" required class="input w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">統一編號</label>
            <input v-model="customerForm.tax_id" class="input w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">產業</label>
            <input v-model="customerForm.industry" class="input w-full" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">網站</label>
          <input v-model="customerForm.website" class="input w-full" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">地址</label>
          <input v-model="customerForm.address" class="input w-full" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">備註</label>
          <textarea v-model="customerForm.notes" class="input w-full h-24 pt-2"></textarea>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
          <button type="button" @click="isCustomerModalOpen = false" class="btn-secondary py-1.5 px-3 text-sm">取消</button>
          <button type="submit" :disabled="saving" class="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />儲存變更
          </button>
        </div>
      </form>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { ArrowLeft, Building, Edit2, Users, Phone, Mail, Activity as ActivityIcon, Loader2, Trash2, X } from 'lucide-vue-next'
import ActivityTimeline from '@/components/crm/ActivityTimeline.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotificationStore()

const loading = ref(true)
const saving = ref(false)
const customerId = route.params.id as string
const customer = ref<any>(null)
const contacts = ref<any[]>([])
const deals = ref<any[]>([])
const isContactModalOpen = ref(false)
const isContactEditing = ref(false)
const currentContactId = ref('')

const isCustomerModalOpen = ref(false)
const customerForm = ref({
  name: '', tax_id: '', industry: '', website: '', address: '', notes: ''
})

const contactForm = ref({
  name: '', title: '', phone: '', email: '', is_primary: false
})

onMounted(async () => {
  if (!auth.hasPermission('customers:view')) {
    notify.error('權限不足', '您沒有瀏覽客戶的權限')
    router.push('/dashboard')
    return
  }

  try {
    // 1. 抓取客戶基本資料
    const { data: cData, error: cErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()
    
    if (cErr) throw cErr
    customer.value = cData

    // 2. 抓取關聯聯絡人
    const { data: contactsData, error: contactsErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (contactsErr) throw contactsErr
    if (contactsData) contacts.value = contactsData

    // 3. 抓取關聯商機
    const { data: dealsData, error: dealsErr } = await supabase
      .from('deals')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      
    if (dealsErr) throw dealsErr
    if (dealsData) deals.value = dealsData

  } catch (err: any) {
    notify.error('載入失敗', '查無此客戶或權限不足')
    router.push('/crm/customers')
  } finally {
    loading.value = false
  }
})

function openContactModal(item?: any) {
  isContactEditing.value = !!item
  if (item) {
    currentContactId.value = item.id
    contactForm.value = { 
      name: item.name, 
      title: item.title || '', 
      phone: item.phone || '', 
      email: item.email || '', 
      is_primary: !!item.is_primary 
    }
  } else {
    currentContactId.value = ''
    contactForm.value = { name: '', title: '', phone: '', email: '', is_primary: false }
  }
  isContactModalOpen.value = true
}

function openCustomerEditModal() {
  customerForm.value = {
    name: customer.value.name,
    tax_id: customer.value.tax_id || '',
    industry: customer.value.industry || '',
    website: customer.value.website || '',
    address: customer.value.address || '',
    notes: customer.value.notes || ''
  }
  isCustomerModalOpen.value = true
}

async function saveCustomer() {
  saving.value = true
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerForm.value)
      .eq('id', customerId)
      .select()
      .single()

    if (error) throw error
    customer.value = data
    notify.success('客戶資料已更新')
    isCustomerModalOpen.value = false
  } catch (err: any) {
    notify.error('更新失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function saveContact() {
  saving.value = true
  try {
    if (isContactEditing.value) {
      const { data, error } = await supabase
        .from('contacts')
        .update({ ...contactForm.value })
        .eq('id', currentContactId.value)
        .select()
        .single()

      if (error) throw error
      const idx = contacts.value.findIndex(c => c.id === currentContactId.value)
      if (idx > -1) {
        if (data.is_primary) contacts.value.forEach(c => c.is_primary = false)
        contacts.value[idx] = data
      }
      notify.success('聯絡人已更新')
    } else {
      const { data, error } = await supabase.from('contacts').insert({
        ...contactForm.value,
        customer_id: customerId,
      }).select().single()

      if (error) throw error
      if (data) {
        if (data.is_primary) {
          contacts.value.forEach(c => c.is_primary = false)
        }
        contacts.value.unshift(data)
      }
      notify.success('聯絡人新增成功')
    }
    isContactModalOpen.value = false
  } catch(err: any) {
    notify.error('儲存失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function deleteContact(id: string) {
  if(!confirm('確認移除此聯絡人？')) return
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if(error) throw error
    contacts.value = contacts.value.filter(c => c.id !== id)
    notify.success('已移除')
  } catch(err: any) {
    notify.error('移除失敗', err.message)
  }
}

function getDealStageLabel(stage: string) {
  const map: Record<string, string> = {
    'new': '初步接觸', 'qualified': '需求確認', 'proposal': '報價中', 'won': '贏得訂單', 'lost': '已放棄'
  }
  return map[stage] || stage
}

function getDealProbabilityColor(p: number) {
  if (p >= 80) return 'text-emerald-500'
  if (p >= 50) return 'text-amber-500'
  return 'text-slate-400'
}
</script>
