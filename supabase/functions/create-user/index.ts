import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 初始化 Supabase Admin 客戶端（使用擁有最高權限的 SERVICE_ROLE_KEY）
    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('PROJECT_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    // 2. 驗證呼叫此 API 的人是否為合法的登入使用者
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization Header 存在嗎？', !!authHeader)
    
    if (!authHeader) throw new Error('缺少 Authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    console.log('取得的 Token 前 30 碼：', token.substring(0, 30))
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('getUser 錯誤：', authError)
      throw new Error(`Invalid JWT: ${authError.message}`)
    }
    
    if (!user) throw new Error('未經授權的存取')
    
    // 3. 驗證該使用者是否有建立用戶的權限 (RBAC)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, roles:role_id(permissions)')
      .eq('id', user.id)
      .single()
      
    // 為了相容舊版，暫時允許字串 admin，或檢查 JSONB permissions 陣列
    const permissions = profile?.roles?.permissions || []
    const hasPermission = permissions.includes('all') || permissions.includes('users:create')
    
    if (!hasPermission && profile?.role !== 'admin') {
      throw new Error('權限不足：您沒有建立用戶的權限！')
    }
    
    // 4. 讀取前端傳來的帳號資料
    const { email, password, username, role_id, phone, gender } = await req.json()
    
    if (!email) throw new Error('必須提供 電子郵件')

    // 5. 使用 Admin API 建立真正的 Auth 使用者，並跳過信箱驗證
    const { data: newAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 管理員建立的直接視為已驗證
      user_metadata: { username }
    })
    
    if (createUserError) throw createUserError
    
    // 6. 我們需要更新 profiles (因為 trigger 預設可能是 user，且沒有包含電話性別)
    const profileUpdates: any = {}
    if (role_id) profileUpdates.role_id = role_id
    if (phone) profileUpdates.phone = phone
    if (gender) profileUpdates.gender = gender

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', newAuthUser.user.id)
      
      if (updateError) console.error('更新 Profile 失敗:', updateError)
    }

    // 回傳成功結果給前端
    return new Response(
      JSON.stringify({ success: true, user: newAuthUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
