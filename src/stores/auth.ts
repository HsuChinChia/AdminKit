import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// ── 型別定義 ──────────────────────────────────────────────
export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  phone?: string | null
  gender?: string | null
  role: 'admin' | 'user'
  role_id?: string | null
  roles?: {
    name: string
    permissions: string[]
  } | null
  created_at: string
}

// ── Store ─────────────────────────────────────────────────
export const useAuthStore = defineStore('auth', () => {
  const user    = ref<any>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)

  const role      = computed(() => profile.value?.role ?? 'user')
  
  // ── RBAC 權限判斷 ──
  const permissions = computed(() => {
    const perms = profile.value?.roles?.permissions
    return Array.isArray(perms) ? perms : []
  })
  const hasPermission = (permission: string) => {
    return permissions.value.includes('all') || permissions.value.includes(permission)
  }
  
  // 保留 isAdmin 給舊程式碼用，但改由權限系統判斷
  const isAdmin   = computed(() => hasPermission('all') || role.value === 'admin')
  const isLoggedIn = computed(() => !!user.value)

  // ── 初始化：載入 Session ─────────────────────────────────
  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) await fetchProfile()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile()
      else profile.value = null
    })
    loading.value = false
  }

  // ── 取得 Profile ─────────────────────────────────────────
  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        roles:role_id (
          name,
          permissions
        )
      `)
      .eq('id', user.value.id)
      .single()
    profile.value = data
  }

  // ── 更新 Profile ─────────────────────────────────────────
  async function updateProfile(updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value!.id)
      .select()
      .single()
    if (!error) profile.value = data
    return { data, error }
  }

  // ── Auth 方法 ─────────────────────────────────────────────
  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

  const signUp = (email: string, password: string, username = '') =>
    supabase.auth.signUp({ email, password, options: { data: { username } } })

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

  return {
    user, profile, loading, role, permissions, hasPermission, isAdmin, isLoggedIn,
    init, fetchProfile, updateProfile,
    signIn, signInWithGoogle, signUp, signOut, resetPassword,
  }
})
