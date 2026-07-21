-- ============================================================
-- Kullanıcı engelleme sistemi
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli.

create table public.engellemeler (
	id uuid primary key default gen_random_uuid(),
	engelleyen_id uuid not null references public.profiles (id) on delete cascade,
	engellenen_id uuid not null references public.profiles (id) on delete cascade,
	tarih timestamptz not null default now(),
	unique (engelleyen_id, engellenen_id)
);

alter table public.engellemeler enable row level security;

-- Sadece kendi engellediklerini görebilir/ekleyebilir/kaldırabilir.
create policy "engellemeler_owner_select" on public.engellemeler for select using (auth.uid() = engelleyen_id);
create policy "engellemeler_owner_insert" on public.engellemeler for insert with check (auth.uid() = engelleyen_id);
create policy "engellemeler_owner_delete" on public.engellemeler for delete using (auth.uid() = engelleyen_id);

-- ============================================================
-- messages: engelli kullanıcılar arasında mesaj gönderimini
-- veritabanı seviyesinde engelle (herhangi bir taraf engellemiş olsa yeterli)
-- ============================================================

drop policy if exists "messages_insert_own" on public.messages;

create policy "messages_insert_own" on public.messages for insert with check (
	auth.uid() = gönderen_id
	and not exists (
		select 1 from public.engellemeler e
		where (e.engelleyen_id = gönderen_id and e.engellenen_id = alıcı_id)
			 or (e.engelleyen_id = alıcı_id and e.engellenen_id = gönderen_id)
	)
);

-- ============================================================
-- Anonim eşleştirme: engelli kullanıcıları eşleşme havuzundan çıkar
-- ============================================================

create or replace function public.bul_anonim_eslesme(p_alışkanlık_adı text)
returns table (matched_user_id uuid, matched_kullanici_adi text)
language plpgsql
security definer set search_path = public
as $$
declare
	v_found_user uuid;
begin
	select h.user_id into v_found_user
	from public.habits h
	where h.aktif_mi = true
		and lower(h.alışkanlık_adı) = lower(p_alışkanlık_adı)
		and h.user_id <> auth.uid()
		and not exists (
			select 1 from public.matches m
			where (m.user_id_1 = auth.uid() and m.user_id_2 = h.user_id)
				 or (m.user_id_2 = auth.uid() and m.user_id_1 = h.user_id)
		)
		and not exists (
			select 1 from public.engellemeler e
			where (e.engelleyen_id = auth.uid() and e.engellenen_id = h.user_id)
				 or (e.engelleyen_id = h.user_id and e.engellenen_id = auth.uid())
		)
	order by random()
	limit 1;

	if v_found_user is null then
		return;
	end if;

	insert into public.matches (user_id_1, user_id_2, alışkanlık_türü)
	values (auth.uid(), v_found_user, p_alışkanlık_adı);

	return query
	select v_found_user, p.kullanici_adi
	from public.profiles p
	where p.id = v_found_user;
end;
$$;
