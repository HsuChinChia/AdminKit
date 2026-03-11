import { ref, readonly, computed } from 'vue'
import { supabase } from '@/lib/supabase'

interface FetchOptions {
  search?: string
  searchCols?: string[]
  orderCol?: string
  ascending?: boolean
  filters?: Record<string, any>
}

/**
 * 通用 CRUD 組合式函數（TypeScript 泛型）
 *
 * 使用方式：
 *   const { items, loading, fetch, create, update, remove } = useCRUD<User>('profiles')
 */
export function useCRUD<T = Record<string, any>>(
  tableName: string,
  options: { defaultOrder?: { column: string; ascending: boolean }; select?: string; pageSize?: number } = {}
) {
  const {
    defaultOrder = { column: 'created_at', ascending: false },
    select       = '*',
    pageSize     = 10,
  } = options

  const items   = ref<T[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)
  const total   = ref(0)
  const page    = ref(1)

  async function fetch({
    search     = '',
    searchCols = [] as string[],
    orderCol   = defaultOrder.column,
    ascending  = defaultOrder.ascending,
    filters    = {} as Record<string, any>,
  }: FetchOptions = {}) {
    loading.value = true
    error.value   = null
    try {
      let query = supabase
        .from(tableName)
        .select(select, { count: 'exact' })
        .order(orderCol, { ascending })
        .range((page.value - 1) * pageSize, page.value * pageSize - 1)

      if (search && searchCols.length) {
        const orClause = searchCols.map(col => `${col}.ilike.%${search}%`).join(',')
        query = query.or(orClause)
      }

      Object.entries(filters).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          query = query.eq(key, val)
        }
      })

      const { data, error: err, count } = await query
      if (err) throw err
      items.value = (data ?? []) as T[]
      total.value = count ?? 0
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Partial<T>) {
    const { data, error: err } = await supabase.from(tableName).insert(payload).select().single()
    return { data: data as T | null, error: err }
  }

  async function update(id: string | number, payload: Partial<T>) {
    const { data, error: err } = await supabase.from(tableName).update(payload).eq('id', id).select().single()
    return { data: data as T | null, error: err }
  }

  async function remove(id: string | number) {
    const { error: err } = await supabase.from(tableName).delete().eq('id', id)
    return { error: err }
  }

  const totalPages    = computed(() => Math.ceil(total.value / pageSize))
  const setPage = (p: number) => { page.value = p }

  return {
    items: readonly(items),
    loading: readonly(loading),
    error:   readonly(error),
    total:   readonly(total),
    page, pageSize, totalPages, setPage,
    fetch, create, update, remove,
  }
}
