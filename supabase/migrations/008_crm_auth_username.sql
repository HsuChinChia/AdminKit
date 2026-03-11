-- ==========================================
-- Refactor: Username-based Login Support
-- ==========================================

-- 1. 在 profiles 新增欄位
-- login_account: 登入帳號，例如 'admin', 'engineer01'
-- email: 您真實的外部電子郵件 (選填)
alter table public.profiles 
    add column if not exists login_account text unique,
    add column if not exists email text;

-- 2. 建立索引以確保查詢效率
create index if not exists idx_profiles_login_account on public.profiles(login_account);
create index if not exists idx_profiles_email on public.profiles(email);

-- 3. 將現有的信箱資料同步回 profiles.email (可選)
-- 注意：這裡我們暫時不預設 login_account，因為舊有用戶可能需要手動指定或之後由管理員更新。
-- 為了不破壞現有權限，我們先保留 auth.users 的 email 做為主要登入依據。
-- 新邏輯將會是在前端把 account 映射為 account@internal.crm。

-- 4. 註解
comment on column public.profiles.login_account is '實體物件登入帳號 (不含域名)';
comment on column public.profiles.email is '選填的真實聯絡電子郵件';
