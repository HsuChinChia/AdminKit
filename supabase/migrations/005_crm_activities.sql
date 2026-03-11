-- ==========================================
-- CRM Module 3: Activities & Tasks (互動紀錄與任務追蹤)
-- ==========================================

-- 1. 建立 activities 表格 (互動紀錄/日誌)
create table if not exists public.activities (
    id uuid default gen_random_uuid() primary key,
    type text not null default 'note' check (type in ('note', 'call', 'meeting', 'email')), -- 紀錄類型
    content text not null,                   -- 紀錄內容
    customer_id uuid references public.customers(id) on delete cascade,    -- 關聯客戶 (必填)
    deal_id uuid references public.deals(id) on delete cascade,            -- 關聯商機 (選填)
    contact_id uuid references public.contacts(id) on delete set null,     -- 關聯特定聯絡人 (選填)
    owner_id uuid references public.profiles(id) on delete set null,            -- 建立業務
    performed_at timestamptz default now(),  -- 實際互動發生時間
    created_at timestamptz default now()
);

-- 2. 建立 tasks 表格 (待辦事項/日曆)
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    title text not null,                     -- 任務標題 (e.g., "打電話確認需求")
    description text,                        -- 任務內容
    due_date timestamptz,                    -- 預計完成期限
    is_completed boolean default false,      -- 是否已完成
    priority text default 'medium' check (priority in ('low', 'medium', 'high')), -- 優先級
    customer_id uuid references public.customers(id) on delete cascade,    -- 關聯客戶 (選填)
    deal_id uuid references public.deals(id) on delete cascade,            -- 關聯商機 (選填)
    assignee_id uuid references public.profiles(id) on delete set null,         -- 指派給誰
    creator_id uuid references public.profiles(id) on delete set null,          -- 任務建立者
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

drop trigger if exists update_tasks_modtime on tasks;
create trigger update_tasks_modtime
    before update on tasks
    for each row execute procedure update_modified_column();


-- ==========================================
-- Row Level Security (RLS) 權限設定
-- ==========================================
alter table public.activities enable row level security;
alter table public.tasks enable row level security;

-- Activities
create policy "Authenticated users can view activities" 
  on activities for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert activities" 
  on activities for insert with check (auth.role() = 'authenticated');
create policy "Users can update own activities" 
  on activities for update using (auth.uid() = owner_id);
create policy "Users can delete own activities" 
  on activities for delete using (auth.uid() = owner_id);

-- Tasks
create policy "Authenticated users can view tasks" 
  on tasks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert tasks" 
  on tasks for insert with check (auth.role() = 'authenticated');
create policy "Assignees or creators can update tasks" 
  on tasks for update using (auth.uid() = assignee_id or auth.uid() = creator_id);
create policy "Creators can delete tasks" 
  on tasks for delete using (auth.uid() = creator_id);
