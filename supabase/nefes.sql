-- ============================================================
-- Nefes egzersizi (Rahatla) seans kayıtları
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli.

create table public.nefes_seanslari (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	teknik_id text not null,
	tamamlanan_tur integer not null default 0,
	toplam_saniye integer not null default 0,
	tarih timestamptz not null default now()
);

alter table public.nefes_seanslari enable row level security;

create policy "nefes_seanslari_owner_all" on public.nefes_seanslari
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
