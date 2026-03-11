-- ==========================================
-- CRM Module 5: Ticketing (客服派單與維修系統)
-- ==========================================

create table if not exists public.tickets (
    id uuid default gen_random_uuid() primary key,
    subject text not null,                                         -- 主旨 / 問題簡述
    description text,                                              -- 詳細描述
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')), -- 優先順序
    status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')), -- 狀態
    customer_id uuid references public.customers(id) on delete cascade not null, -- 關聯客戶
    contact_id uuid references public.contacts(id) on delete set null, -- 關聯聯絡人
    assignee_id uuid references public.profiles(id) on delete set null, -- 負責處理的人員
    creator_id uuid references public.profiles(id) on delete set null, -- 建立者
    image_paths text[],                                            -- 現場照片路徑 (Storage)
    resolved_at timestamptz,                                       -- 結案時間
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 自動更新 updated_at
drop trigger if exists update_tickets_modtime on tickets;
create trigger update_tickets_modtime
    before update on tickets
    for each row execute procedure update_modified_column();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
alter table public.tickets enable row level security;

-- 任何人可讀取 (或可根據需求改為僅限擁有者)
drop policy if exists "Authenticated users can view tickets" on tickets;
create policy "Authenticated users can view tickets" 
  on tickets for select using (auth.role() = 'authenticated');

-- 登入用戶可新增
drop policy if exists "Authenticated users can insert tickets" on tickets;
create policy "Authenticated users can insert tickets" 
  on tickets for insert with check (auth.role() = 'authenticated');

-- 負責人或管理員可更新
drop policy if exists "Users can update relevant tickets" on tickets;
create policy "Users can update relevant tickets" 
  on tickets for update using (
    auth.uid() = assignee_id or 
    auth.uid() = creator_id or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 管理員可刪除
drop policy if exists "Admins can delete tickets" on tickets;
create policy "Admins can delete tickets" 
  on tickets for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 如果 supabase storage 尚未開通這個 bucket，手動建立一個「私有」的 Bucket：
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tickets', 'tickets', false) 
ON CONFLICT DO NOTHING;

-- Storage RLS for tickets
drop policy if exists "Authenticated users can select ticket_files" on storage.objects;
create policy "Authenticated users can select ticket_files"
  on storage.objects for select
  using ( bucket_id = 'tickets' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can insert ticket_files" on storage.objects;
create policy "Authenticated users can insert ticket_files"
  on storage.objects for insert
  with check ( bucket_id = 'tickets' and auth.role() = 'authenticated' );
