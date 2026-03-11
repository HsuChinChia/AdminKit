<template>
  <div class="space-y-4">
    <!-- 撰寫紀錄區 -->
    <div class="bg-white dark:bg-surface-dark-muted rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
      <form @submit.prevent="submitActivity">
        <div class="flex gap-2 mb-3">
          <button 
            type="button"
            v-for="t in types" 
            :key="t.id"
            @click="form.type = t.id"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
            :class="form.type === t.id 
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800' 
              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'"
          >
            <component :is="t.icon" class="w-3.5 h-3.5 inline-block mr-1" />
            {{ t.label }}
          </button>
        </div>
        <textarea 
          v-model="form.content" 
          rows="3" 
          class="input w-full bg-slate-50/50 dark:bg-slate-900/50 text-sm" 
          placeholder="寫下您剛結案或即將處理的筆記、會議摘要..."
          required
        ></textarea>
        <div class="flex justify-end mt-3">
          <button type="submit" :disabled="saving || !form.content.trim()" class="btn-primary flex items-center gap-2 py-1.5 px-4 text-sm">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            留下記錄
          </button>
        </div>
      </form>
    </div>

    <!-- 時間軸列表 -->
    <div v-if="loading" class="py-8 flex justify-center">
      <Loader2 class="w-6 h-6 animate-spin text-slate-400" />
    </div>
    <div v-else-if="activities.length === 0" class="py-12 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
      尚無歷史互動紀錄
    </div>
    <div v-else class="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
      
      <div v-for="act in activities" :key="act.id" class="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        
        <!-- Icon Marker -->
        <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-surface-dark-bg bg-white dark:bg-slate-800 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"
             :class="getTypeColor(act.type)">
          <component :is="getTypeIcon(act.type)" class="w-4 h-4" />
        </div>

        <!-- Content Card -->
        <div class="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark-muted shadow-sm group-hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold uppercase tracking-wider" :class="getTypeColor(act.type)">{{ getTypeLabel(act.type) }}</span>
            <span class="text-xs text-slate-400">{{ formatDate(act.performed_at) }}</span>
          </div>
          <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-2 leading-relaxed">{{ act.content }}</p>
          
          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                {{ act.owner?.username?.charAt(0).toUpperCase() || '?' }}
              </div>
              <span>{{ act.owner?.username || '未知業務' }}</span>
            </div>
            <button 
              v-if="auth.user?.id === act.owner_id"
              @click="deleteActivity(act.id)" 
              class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { StickyNote, PhoneCall, Users, Mail, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  customerId: string
}>()

const auth = useAuthStore()
const notify = useNotificationStore()

interface Activity {
  id: string
  type: string
  content: string
  owner_id: string
  performed_at: string
  owner?: { username: string }
}

const activities = ref<Activity[]>([])
const loading = ref(true)
const saving = ref(false)

const types = [
  { id: 'note',    label: '備註/筆記', icon: StickyNote },
  { id: 'call',    label: '電話聯繫',   icon: PhoneCall  },
  { id: 'meeting', label: '會議/拜訪',  icon: Users      },
  { id: 'email',   label: 'Email',     icon: Mail       },
]

const form = ref({ type: 'note', content: '' })

async function fetchActivities() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*, owner:profiles!owner_id(username)')
      .eq('customer_id', props.customerId)
      .order('performed_at', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    activities.value = data as Activity[]
  } catch (err: any) {
    notify.error('載入互動紀錄失敗', err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchActivities()
})

async function submitActivity() {
  if (!form.value.content.trim()) return
  saving.value = true
  try {
    const { error } = await supabase.from('activities').insert({
      type: form.value.type,
      content: form.value.content,
      customer_id: props.customerId,
      owner_id: auth.user?.id,
      performed_at: new Date().toISOString()
    })
    if (error) throw error
    form.value.content = ''
    fetchActivities()
    notify.success('紀錄已新增')
  } catch (err: any) {
    notify.error('新增失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function deleteActivity(id: string) {
  if(!confirm('確定要刪除這筆紀錄嗎？')) return
  try {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) throw error
    activities.value = activities.value.filter(a => a.id !== id)
    notify.success('紀錄已刪除')
  } catch (err: any) {
    notify.error('刪除失敗', err.message)
  }
}

// ── UI Helpers ──────────────────────────────────────────────
function getTypeLabel(typeId: string) {
  return types.find(t => t.id === typeId)?.label || '紀錄'
}
function getTypeIcon(typeId: string) {
  return types.find(t => t.id === typeId)?.icon || StickyNote
}
function getTypeColor(typeId: string) {
  const map: Record<string, string> = {
    'note':    'text-blue-500',
    'call':    'text-emerald-500',
    'meeting': 'text-purple-500',
    'email':   'text-amber-500'
  }
  return map[typeId] || 'text-slate-500'
}
function formatDate(isoStr: string) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
