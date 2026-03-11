-- ==========================================
-- Patch: Fix audit_logs FK for PostgREST join
-- 將 user_id 的外鍵改為參考 public.profiles
-- 請在 Supabase SQL Editor 執行此指令
-- ==========================================

-- 刪除舊的外鍵（指向 auth.users）
alter table public.audit_logs
  drop constraint if exists audit_logs_user_id_fkey;

-- 建立新的外鍵（指向 public.profiles）
alter table public.audit_logs
  add constraint audit_logs_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete set null;
