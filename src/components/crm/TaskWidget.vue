<template>
  <div class="card flex flex-col h-full">
    <div class="card-header flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border pb-4">
      <h2 class="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
        <CheckSquare class="w-5 h-5 text-primary-500" /> 待辦事項
      </h2>
      <button @click="openModal()" class="text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none">
        + 新增
      </button>
    </div>

    <!-- 任務列表 -->
    <div class="card-body flex-1 overflow-y-auto p-4 max-h-[400px]">
      <div v-if="loading" class="flex justify-center py-6">
        <Loader2 class="w-6 h-6 animate-spin text-slate-400" />
      </div>
      <div v-else-if="tasks.length === 0" class="text-center py-10 text-sm text-slate-400">
        目前沒有待辦事項 🎉
      </div>
      <div v-else class="space-y-3">
        <div 
          v-for="task in tasks" 
          :key="task.id"
          class="flex items-start gap-3 p-3 rounded-xl border transition-colors group"
          :class="task.is_completed 
            ? 'border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/20' 
            : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-700 dark:bg-surface-dark-muted dark:hover:border-primary-700'"
        >
          <!-- Checkbox -->
          <div class="pt-0.5 shrink-0">
            <button 
              @click="toggleTask(task)"
              class="w-5 h-5 rounded border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              :class="task.is_completed 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 hover:border-primary-500 text-transparent hover:text-primary-200'"
            >
              <Check class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 
                class="text-sm font-medium leading-snug truncate transition-colors"
                :class="task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'"
              >
                {{ task.title }}
              </h4>
              <button 
                @click="deleteTask(task.id)"
                class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded -mr-1 -mt-1"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
              <span v-if="task.due_date" class="flex items-center gap-1" :class="getDueDateColor(task.due_date, task.is_completed)">
                <Calendar class="w-3 h-3" /> {{ formatDate(task.due_date) }}
              </span>
              <span v-if="task.customer?.name" class="flex items-center gap-1 truncate max-w-[120px]" title="關聯客戶">
                <Building class="w-3 h-3" /> {{ task.customer.name }}
              </span>
              <span v-if="task.priority === 'high'" class="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle class="w-3 h-3" /> 高優先級
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-surface-dark-muted rounded-xl shadow-xl w-full max-w-sm">
        <form @submit.prevent="addTask" class="p-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-slate-800 dark:text-white">新增待辦事項</h3>
            <button type="button" @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600"><X class="w-4 h-4"/></button>
          </div>
          
          <div class="space-y-3">
            <div>
              <input v-model="newTask.title" placeholder="任務標題..." class="input w-full" required autofocus />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">到期日</label>
                <input v-model="newTask.date" type="date" class="input w-full text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">優先順序</label>
                <select v-model="newTask.priority" class="input w-full text-sm cursor-pointer">
                  <option value="low">低</option>
                  <option value="medium">一般</option>
                  <option value="high">高</option>
                </select>
              </div>
            </div>
            
            <!-- (Optional) 可在此處擴充客戶/商機的選擇下拉框 -->
            
          </div>
          
          <div class="mt-5 flex justify-end gap-2 text-sm">
            <button type="button" @click="isModalOpen = false" class="btn-secondary py-1.5 px-3">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary py-1.5 px-4 flex items-center gap-2">
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin"/> 儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { CheckSquare, Check, Trash2, Calendar, Building, AlertCircle, X, Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const notify = useNotificationStore()

interface Task {
  id: string
  title: string
  due_date: string | null
  is_completed: boolean
  priority: string
  customer?: { name: string }
}

const tasks = ref<Task[]>([])
const loading = ref(true)

const isModalOpen = ref(false)
const saving = ref(false)
const newTask = ref({ title: '', date: '', priority: 'medium' })

async function fetchTasks() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, customer:customers(name)')
      .eq('assignee_id', auth.user?.id) // 指派給自己的任務
      .order('is_completed', { ascending: true })   // 未完成的排前面
      .order('due_date', { ascending: true, nullsFirst: false }) // 日期近的排前面
      .limit(20)
    
    if (error) throw error
    tasks.value = data as Task[]
  } catch (err: any) {
    console.error('Task fetch error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.user) fetchTasks()
})

function openModal() {
  newTask.value = { title: '', date: '', priority: 'medium' }
  isModalOpen.value = true
}

async function addTask() {
  if (!newTask.value.title.trim()) return
  saving.value = true
  try {
    const payload = {
      title: newTask.value.title,
      priority: newTask.value.priority,
      due_date: newTask.value.date || null,
      assignee_id: auth.user?.id,
      creator_id: auth.user?.id
    }
    
    const { error } = await supabase.from('tasks').insert(payload)
    if (error) throw error
    
    isModalOpen.value = false
    notify.success('任務已新增')
    fetchTasks()
  } catch (err: any) {
    notify.error('新增失敗', err.message)
  } finally {
    saving.value = false
  }
}

async function toggleTask(task: Task) {
  // Optimistic UI
  task.is_completed = !task.is_completed
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: task.is_completed })
      .eq('id', task.id)
    if (error) throw error
  } catch (err: any) {
    // Revert
    task.is_completed = !task.is_completed
    notify.error('狀態更新失敗', err.message)
  }
}

async function deleteTask(id: string) {
  if (!confirm('刪除待辦事項？')) return
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    tasks.value = tasks.value.filter(t => t.id !== id)
  } catch (err: any) {
    notify.error('刪除失敗', err.message)
  }
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

function getDueDateColor(isoStr: string, isCompleted: boolean) {
  if (isCompleted) return ''
  const due = new Date(isoStr).getTime()
  const today = new Date().setHours(0,0,0,0)
  
  if (due < today) return 'text-red-500 font-medium' // 逾期
  if (due === today) return 'text-amber-500 font-medium' // 今天到期
  return ''
}
</script>
