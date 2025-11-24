-- Supabase schema for PMO Candidate Profiles

create table if not exists candidate_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique,
  full_name text,
  location text,
  work_pref text,
  contact_email text,
  linkedin text,
  bio text,
  skills jsonb,
  projects jsonb,
  certifications jsonb,
  tools jsonb,
  cv_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists candidate_certifications (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  name text,
  issuer text,
  issued_at date,
  file_url text
);

create table if not exists candidate_tools (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  tool_name text,
  level text
);

create table if not exists candidate_projects (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidate_profiles(id) on delete cascade,
  title text,
  organisation text,
  start_date date,
  end_date date,
  delivery_method text,
  description text,
  role text,
  tools text[],
  achievements text[]
);

-- Indexes
create index if not exists idx_candidate_profiles_user on candidate_profiles(user_id);
