-- ============================================================
-- Bağımlılıkla Mücadele Web Sitesi — Supabase Şeması
-- ============================================================
-- Not: auth.users Supabase'in kendi tablosu. "users" burada
-- profile tablosu olarak, auth.users.id'ye foreign key ile bağlanır.

create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	kullanici_adi text unique not null,
	dil_tercihi text not null default 'tr' check (dil_tercihi in ('tr', 'en')),
	tema_tercihi text not null default 'light' check (tema_tercihi in ('light', 'dark')),
	olusturulma_tarihi timestamptz not null default now(),
	davet_kodu text unique,
	davet_eden_id uuid references public.profiles (id),
	anasayfa_bonus_alindi boolean not null default false
);

create table public.habits (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	alışkanlık_adı text not null,
	başlangıç_tarihi timestamptz not null,
	günlük_tasarruf_miktarı numeric(10, 2) default 0,
	aktif_mi boolean not null default true,
	en_uzun_seri interval not null default '0',
	hedef_gun_sayisi integer
);

create table public.relapses (
	id uuid primary key default gen_random_uuid(),
	habit_id uuid not null references public.habits (id) on delete cascade,
	tarih timestamptz not null default now(),
	not_ text
);

create table public.checkins (
	id uuid primary key default gen_random_uuid(),
	habit_id uuid not null references public.habits (id) on delete cascade,
	tarih timestamptz not null default now(),
	mood smallint not null check (mood between 1 and 5),
	tetikleyici_notu text
);

create table public.house_items (
	id uuid primary key default gen_random_uuid(),
	ad text not null,
	kategori text not null,
	fiyat integer not null default 0,
	gerekli_gün_sayısı integer not null default 0,
	görsel_referans text,
	nadir_mi boolean not null default false
);

create table public.user_house (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	item_id uuid not null references public.house_items (id) on delete cascade,
	satın_alma_tarihi timestamptz not null default now(),
	konum_x integer not null default 0,
	konum_y integer not null default 0
);

create table public.coins (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null unique references public.profiles (id) on delete cascade,
	bakiye integer not null default 0,
	son_güncelleme timestamptz not null default now()
);

create table public.messages (
	id uuid primary key default gen_random_uuid(),
	gönderen_id uuid not null references public.profiles (id) on delete cascade,
	alıcı_id uuid not null references public.profiles (id) on delete cascade,
	içerik text not null,
	tarih timestamptz not null default now(),
	tip text not null default 'motivasyon'
);

create table public.matches (
	id uuid primary key default gen_random_uuid(),
	user_id_1 uuid not null references public.profiles (id) on delete cascade,
	user_id_2 uuid not null references public.profiles (id) on delete cascade,
	alışkanlık_türü text not null,
	eşleşme_tarihi timestamptz not null default now()
);

create table public.achievements (
	id uuid primary key default gen_random_uuid(),
	ad text not null,
	açıklama text,
	gerekli_gün_sayısı integer not null,
	ikon text
);

create table public.user_achievements (
	user_id uuid not null references public.profiles (id) on delete cascade,
	achievement_id uuid not null references public.achievements (id) on delete cascade,
	kazanılma_tarihi timestamptz not null default now(),
	primary key (user_id, achievement_id)
);

-- ============================================================
-- Yeni kullanıcı kaydında otomatik profil oluşturma
-- ============================================================
-- signUp sırasında email doğrulaması bekleniyorsa henüz oturum açılmamış olabilir,
-- bu yüzden profiles satırını client'tan değil, bu trigger ile DB tarafında oluşturuyoruz.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
	v_davet_kodu text;
	v_davet_eden_kodu text;
	v_davet_eden_id uuid;
	v_bonus_davet_eden integer := 50;
	v_bonus_yeni_kullanici integer := 20;
begin
	v_davet_kodu := substr(replace(new.id::text, '-', ''), 1, 8);
	v_davet_eden_kodu := new.raw_user_meta_data ->> 'davet_kodu';

	if v_davet_eden_kodu is not null then
		select id into v_davet_eden_id from public.profiles where davet_kodu = v_davet_eden_kodu;
	end if;

	insert into public.profiles (id, kullanici_adi, davet_kodu, davet_eden_id)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'kullanici_adi', split_part(new.email, '@', 1)),
		v_davet_kodu,
		v_davet_eden_id
	);

	insert into public.coins (user_id, bakiye)
	values (new.id, case when v_davet_eden_id is not null then v_bonus_yeni_kullanici else 0 end);

	if v_davet_eden_id is not null then
		update public.coins set bakiye = bakiye + v_bonus_davet_eden, son_güncelleme = now() where user_id = v_davet_eden_id;
	end if;

	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.relapses enable row level security;
alter table public.checkins enable row level security;
alter table public.house_items enable row level security;
alter table public.user_house enable row level security;
alter table public.coins enable row level security;
alter table public.messages enable row level security;
alter table public.matches enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- profiles: herkes temel profil bilgisini görebilir (kullanıcı adı vb. sosyal alanlarda gerekli),
-- ama sadece kendi profilini güncelleyebilir.
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- habits: SADECE kendi kullanıcısına açık
create policy "habits_owner_all" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- relapses: habit üzerinden sahiplik kontrolü
create policy "relapses_owner_all" on public.relapses for all using (
	exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
) with check (
	exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
);

-- checkins: habit üzerinden sahiplik kontrolü
create policy "checkins_owner_all" on public.checkins for all using (
	exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
) with check (
	exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
);

-- coins: SADECE kendi kullanıcısına açık
create policy "coins_owner_all" on public.coins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- house_items: katalog, herkese açık okuma; yazma yok (admin/seed ile yönetilir)
create policy "house_items_select_all" on public.house_items for select using (true);

-- user_house: herkes SELECT edebilir (başkasının evini görmek için gerekli),
-- ama sadece kendi satırını ekleyip güncelleyebilir.
create policy "user_house_select_all" on public.user_house for select using (true);
create policy "user_house_insert_own" on public.user_house for insert with check (auth.uid() = user_id);
create policy "user_house_update_own" on public.user_house for update using (auth.uid() = user_id);

-- messages: sadece gönderen veya alıcı görebilir; sadece gönderen olarak ekleyebilir.
create policy "messages_select_participant" on public.messages for select using (
	auth.uid() = gönderen_id or auth.uid() = alıcı_id
);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = gönderen_id);

-- matches: sadece eşleşmenin taraflarından biri görebilir.
create policy "matches_select_participant" on public.matches for select using (
	auth.uid() = user_id_1 or auth.uid() = user_id_2
);

-- achievements: katalog, herkese açık okuma.
create policy "achievements_select_all" on public.achievements for select using (true);

-- user_achievements: kazanımlar herkese açık (rozet vitrini için), sadece sistem/kendi ekleyebilir.
create policy "user_achievements_select_all" on public.user_achievements for select using (true);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);
