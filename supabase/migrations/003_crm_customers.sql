-- ==========================================
-- CRM Module: Customers & Contacts
-- ==========================================

-- 1. 建立 customers 表格 (客戶/公司)
create table if not exists public.customers (
    id uuid default gen_random_uuid() primary key,
    name text not null,                   -- 公司或客戶名稱
    tax_id text,                          -- 統一編號
    industry text,                        -- 產業類別
    website text,                         -- 官方網站
    address text,                         -- 公司地址
    notes text,                           -- 備註
    owner_id uuid references auth.users(id) on delete set null, -- 負責業務
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 自動更新 updated_at 觸發器 (假設已有此 function, 如果沒有我們在這裡先防錯)
create or replace function update_modified_column()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists update_customers_modtime on customers;
create trigger update_customers_modtime
    before update on customers
    for each row execute procedure update_modified_column();

-- 2. 建立 contacts 表格 (聯絡人)
create table if not exists public.contacts (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null, -- 關聯之客戶
    name text not null,                   -- 聯絡人姓名
    title text,                           -- 職稱
    email text,                           -- 電子郵件
    phone text,                           -- 聯絡電話
    mobile text,                          -- 手機
    is_primary boolean default false,     -- 是否為主要聯絡人
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

drop trigger if exists update_contacts_modtime on contacts;
create trigger update_contacts_modtime
    before update on contacts
    for each row execute procedure update_modified_column();


-- ==========================================
-- Row Level Security (RLS) 權限設定
-- ==========================================
alter table public.customers enable row level security;
alter table public.contacts enable row level security;

-- 任何人只要登入就可以「看」客戶 (真實世界中可能會依賴業務權限，此處作為通用模板設定為已登入即可見)
create policy "Authenticated users can view customers" 
  on customers for select 
  using (auth.role() = 'authenticated');

create policy "Authenticated users can view contacts" 
  on contacts for select 
  using (auth.role() = 'authenticated');

-- 新增、修改、刪除可以依賴前端 RBAC (檢查 'customers:create' 等)，
-- 但保險起見，我們在 RLS 層確保必須是 authenticated。
-- 更嚴格的 RLS 應該去 join profiles 或是 roles 表驗證權限，
-- 為了保持泛用性，這裡依賴應用層(Edge Functions/Frontend)來做細粒度攔截。
create policy "Authenticated users can insert customers" 
  on customers for insert 
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update customers" 
  on customers for update 
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete customers" 
  on customers for delete 
  using (auth.role() = 'authenticated');

-- contacts 同理
create policy "Authenticated users can insert contacts" 
  on contacts for insert 
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update contacts" 
  on contacts for update 
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete contacts" 
  on contacts for delete 
  using (auth.role() = 'authenticated');
