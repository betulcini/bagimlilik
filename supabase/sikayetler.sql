-- ============================================================
-- Mesaj şikayet sistemi
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli.
-- Not: Bu projede ayrı bir "admin paneli" yok — şikayetleri sen
-- (proje sahibi olarak) Supabase panelindeki Table Editor'den
-- "sikayetler" tablosuna bakarak inceleyebilirsin (kendi hesabınla
-- girdiğinde RLS'i atlayıp tüm satırları görürsün).

create table public.sikayetler (
	id uuid primary key default gen_random_uuid(),
	şikayet_eden_id uuid not null references public.profiles (id) on delete cascade,
	şikayet_edilen_id uuid not null references public.profiles (id) on delete cascade,
	mesaj_id uuid references public.messages (id) on delete set null,
	mesaj_icerigi_kopya text, -- mesaj daha sonra silinirse/değişirse bile içerik kaybolmasın diye
	sebep text,
	tarih timestamptz not null default now(),
	durum text not null default 'bekliyor' check (durum in ('bekliyor', 'incelendi'))
);

alter table public.sikayetler enable row level security;

-- Kullanıcı sadece kendi gönderdiği şikayetleri ekleyebilir/görebilir.
create policy "sikayetler_reporter_insert" on public.sikayetler for insert with check (auth.uid() = şikayet_eden_id);
create policy "sikayetler_reporter_select" on public.sikayetler for select using (auth.uid() = şikayet_eden_id);
