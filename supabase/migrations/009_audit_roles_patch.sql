-- ==========================================
-- Patch: Add audit trigger for roles table
-- 補上 roles 資料表的稽核觸發器
-- ==========================================

drop trigger if exists audit_roles on public.roles;
create trigger audit_roles
    after insert or update or delete on public.roles
    for each row execute function public.create_audit_log();
