-- ==========================================
-- CRM Module 2: Pipeline & Deals (商機管理)
-- ==========================================

-- 1. 建立商機階段枚舉 (如果資料庫支援的話，但為了高兼容性我們用 TEXT CHECK 約束)
-- 階段: new (接洽中), qualified (需求確認), proposal (報價中), won (大吉大利，成功結案), lost (放棄)
-- NOTE: 也可以獨立成一張 pipeline_stages 表，但此模板採用 TEXT 保持簡單

-- 2. 建立 deals 表格 (商機)
create table if not exists public.deals (
    id uuid default gen_random_uuid() primary key,
    title text not null,                  -- 商機名稱 (例如: "2024 Q3 企業網站建置案")
    customer_id uuid references public.customers(id) on delete cascade not null, -- 關聯客戶
    amount numeric(12, 2) default 0,      -- 預估金額
    probability integer default 0 check (probability >= 0 and probability <= 100), -- 預估成功機率 (0-100)
    expected_close_date date,             -- 預計結案日期
    stage text not null default 'new' check (stage in ('new', 'qualified', 'proposal', 'won', 'lost')), -- 目前所處階段
    notes text,                           -- 商機備註
    owner_id uuid references auth.users(id) on delete set null, -- 負責業務
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 自動更新 updated_at 觸發器
drop trigger if exists update_deals_modtime on deals;
create trigger update_deals_modtime
    before update on deals
    for each row execute procedure update_modified_column();


-- ==========================================
-- Row Level Security (RLS) 權限設定
-- ==========================================
alter table public.deals enable row level security;

-- 讀取權限 (通用: 已登入可見，進階應用可限制為 own_deals)
create policy "Authenticated users can view deals" 
  on deals for select 
  using (auth.role() = 'authenticated');

-- 新增商機
create policy "Authenticated users can insert deals" 
  on deals for insert 
  with check (auth.role() = 'authenticated');

-- 更新商機 (例如拖曳 Kanban)
create policy "Authenticated users can update deals" 
  on deals for update 
  using (auth.role() = 'authenticated');

-- 刪除商機
create policy "Authenticated users can delete deals" 
  on deals for delete 
  using (auth.role() = 'authenticated');
