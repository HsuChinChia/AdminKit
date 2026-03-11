-- ==========================================
-- Audit Log System
-- 記錄所有重要資料表的 INSERT/UPDATE/DELETE
-- ==========================================

-- 1. 建立稽核日誌資料表
create table if not exists public.audit_logs (
    id            bigserial primary key,
    table_name    text not null,                  -- 來源資料表
    action        text not null,                  -- INSERT / UPDATE / DELETE
    record_id     text,                           -- 被操作記錄的 ID
    old_data      jsonb,                          -- 操作前資料 (UPDATE/DELETE)
    new_data      jsonb,                          -- 操作後資料 (INSERT/UPDATE)
    user_id       uuid references auth.users(id) on delete set null,
    created_at    timestamptz default now()
);

-- 建立索引以加速查詢
create index if not exists idx_audit_logs_table_name on public.audit_logs(table_name);
create index if not exists idx_audit_logs_action     on public.audit_logs(action);
create index if not exists idx_audit_logs_user_id    on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ==========================================
-- 2. Trigger Function：自動記錄操作
-- ==========================================
create or replace function public.create_audit_log()
returns trigger language plpgsql security definer as $$
declare
    v_record_id text;
    v_user_id   uuid;
begin
    -- 取得目前使用者 ID（透過 auth.uid()）
    v_user_id := auth.uid();

    -- 取得被操作的記錄 ID
    if TG_OP = 'DELETE' then
        v_record_id := old.id::text;
    else
        v_record_id := new.id::text;
    end if;

    insert into public.audit_logs (table_name, action, record_id, old_data, new_data, user_id)
    values (
        TG_TABLE_NAME,
        TG_OP,
        v_record_id,
        case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
        case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
        v_user_id
    );

    if TG_OP = 'DELETE' then
        return old;
    else
        return new;
    end if;
end;
$$;

-- ==========================================
-- 3. 為各資料表掛載 Trigger
-- ==========================================

-- customers
drop trigger if exists audit_customers on public.customers;
create trigger audit_customers
    after insert or update or delete on public.customers
    for each row execute function public.create_audit_log();

-- contacts
drop trigger if exists audit_contacts on public.contacts;
create trigger audit_contacts
    after insert or update or delete on public.contacts
    for each row execute function public.create_audit_log();

-- deals
drop trigger if exists audit_deals on public.deals;
create trigger audit_deals
    after insert or update or delete on public.deals
    for each row execute function public.create_audit_log();

-- contracts
drop trigger if exists audit_contracts on public.contracts;
create trigger audit_contracts
    after insert or update or delete on public.contracts
    for each row execute function public.create_audit_log();

-- tickets
drop trigger if exists audit_tickets on public.tickets;
create trigger audit_tickets
    after insert or update or delete on public.tickets
    for each row execute function public.create_audit_log();

-- profiles (user management)
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
    after insert or update or delete on public.profiles
    for each row execute function public.create_audit_log();

-- ==========================================
-- 4. RLS Policy：僅管理員可讀，任何人不可直接寫入
-- ==========================================
alter table public.audit_logs enable row level security;

-- 僅 admin role 或有 audit:view 權限的使用者可以查閱
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (
        p.role = 'admin'
        or exists (
          select 1 from public.roles r
          where r.id = p.role_id
          and (r.permissions @> '["all"]' or r.permissions @> '["audit:view"]')
        )
      )
    )
  );

-- 禁止任何人直接從前端插入（只允許 trigger 用 security definer 插入）
-- 不設 INSERT/UPDATE/DELETE policy，即預設拒絕。
