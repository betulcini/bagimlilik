-- ============================================================
-- Anonim eşleştirme fonksiyonu
-- ============================================================
-- Bu fonksiyonu bir kere SQL Editor'de çalıştırman yeterli.
-- Aynı alışkanlık türünü bırakmaya çalışan, daha önce eşleşilmemiş
-- rastgele bir kullanıcı bulur ve matches tablosuna kaydeder.
-- security definer olduğu için başkalarının habits satırlarını
-- (RLS'i bypass ederek) okuyabiliyor, ama sadece bu dar amaç için —
-- client hiçbir zaman başkasının habits verisine direkt erişemiyor.

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

grant execute on function public.bul_anonim_eslesme(text) to authenticated;
