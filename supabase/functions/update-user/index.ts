import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('PROJECT_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    // 驗證登入
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('缺少 Authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError) throw new Error(`Invalid JWT: ${authError.message}`)
    if (!user) throw new Error('未經授權')
    
    // 驗證權限 RBAC
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, roles:role_id(permissions)')
      .eq('id', user.id)
      .single()
      
    const permissions = profile?.roles?.permissions || []
    const hasPermission = permissions.includes('all') || permissions.includes('users:edit')
    
    if (!hasPermission && profile?.role !== 'admin') {
      throw new Error('權限不足：您沒有更新用戶的權限！')
    }
    
    // 讀取前端傳來的帳號資料
    const { id, username, role_id, phone, gender } = await req.json()
    if (!id) throw new Error('缺少目標用戶 ID')

    // 更新 profiles (因為 RLS 阻擋 Client 端更新別人資料)
    const profileUpdates: any = {}
    if (username !== undefined) profileUpdates.username = username
    if (role_id !== undefined) profileUpdates.role_id = role_id
    if (phone !== undefined) profileUpdates.phone = phone
    if (gender !== undefined) profileUpdates.gender = gender

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
        
      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
