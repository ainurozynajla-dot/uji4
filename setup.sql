-- ============================================================
-- ANSTRUCEDU - setup database Supabase
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query
-- -> tempel SEMUA isi file ini -> klik Run
-- ============================================================

-- 1) Tabel profil (satu baris per akun). Kata sandi TIDAK disimpan di sini;
--    Supabase Auth yang menyimpannya dalam bentuk hash.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'mahasiswa' check (role in ('admin','mahasiswa')),
  created_at timestamptz not null default now()
);

-- 2) Keamanan baris (RLS): pengguna hanya boleh melihat profilnya sendiri
alter table public.profiles enable row level security;

drop policy if exists "baca profil sendiri" on public.profiles;
create policy "baca profil sendiri" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "ubah profil sendiri" on public.profiles;
create policy "ubah profil sendiri" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Pengguna hanya boleh mengubah kolom full_name (tidak bisa menaikkan role sendiri jadi admin)
revoke update on public.profiles from authenticated;
grant  update (full_name) on public.profiles to authenticated;

-- 3) Otomatis buat profil saat ada akun baru mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) (JALANKAN SETELAH kamu mendaftar akun pertamamu lewat halaman login)
--    Jadikan akunmu admin - ganti emailnya:
-- update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'emailkamu@contoh.com');
