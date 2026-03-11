-- ==========================================
-- CRM Module 4: Quotes & Contracts
-- ==========================================

create table if not exists public.contracts (
    id uuid default gen_random_uuid() primary key,
    title text not null,                                           -- 合約/報價單名稱
    type text not null default 'quote' check (type in ('quote', 'contract', 'other')), -- 文件類型
    status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'expired', 'cancelled')), -- 狀態
    amount numeric,                                                -- 合約總價 / 報價金額
    customer_id uuid references public.customers(id) on delete cascade not null, -- 關聯客戶 (必填)
    deal_id uuid references public.deals(id) on delete set null,   -- 關聯商機 (選填)
    owner_id uuid references public.profiles(id) on delete set null, -- 負責的業務
    file_path text,                                                -- 對應到 Storage 'documents' bucket 裡的路徑
    valid_until timestamptz,                                       -- 報價單有效截止日 / 合約到期日
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

drop trigger if exists update_contracts_modtime on contracts;
create trigger update_contracts_modtime
    before update on contracts
    for each row execute procedure update_modified_column();


-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
alter table public.contracts enable row level security;

-- 任何人可讀取
drop policy if exists "Authenticated users can view contracts" on contracts;
create policy "Authenticated users can view contracts" 
  on contracts for select using (auth.role() = 'authenticated');

-- 登入用戶可新增
drop policy if exists "Authenticated users can insert contracts" on contracts;
create policy "Authenticated users can insert contracts" 
  on contracts for insert with check (auth.role() = 'authenticated');

-- 擁有者或管理員可更新
drop policy if exists "Users can update own contracts" on contracts;
create policy "Users can update own contracts" 
  on contracts for update using (auth.uid() = owner_id);

-- 擁有者或管理員可刪除
drop policy if exists "Users can delete own contracts" on contracts;
create policy "Users can delete own contracts" 
  on contracts for delete using (auth.uid() = owner_id);

-- 如果 supabase storage 尚未開通這個 bucket，手動建立一個「私有」的 Bucket：
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false) 
ON CONFLICT DO NOTHING;

-- Storage RLS
drop policy if exists "Authenticated users can select documents" on storage.objects;
create policy "Authenticated users can select documents"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can insert documents" on storage.objects;
create policy "Authenticated users can insert documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

drop policy if exists "Users can update own documents" on storage.objects;
create policy "Users can update own documents"
  on storage.objects for update
  using ( bucket_id = 'documents' and (auth.uid() = owner OR auth.uid()::text = (storage.foldername(name))[1]) );

drop policy if exists "Users can delete own documents" on storage.objects;
create policy "Users can delete own documents"
  on storage.objects for delete
  using ( bucket_id = 'documents' and (auth.uid() = owner OR auth.uid()::text = (storage.foldername(name))[1]) );
