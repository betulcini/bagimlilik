-- ============================================================
-- Davet sistemi + "ana ekrana ekle" bonusu
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli (schema.sql'i
-- tekrar çalıştırmana gerek yok).

alter table public.profiles
	add column if not exists davet_kodu text unique,
	add column if not exists davet_eden_id uuid references public.profiles (id),
	add column if not exists anasayfa_bonus_alindi boolean not null default false;

-- Mevcut kullanıcılara (bu satır eklenmeden önce kayıt olmuş olanlara) davet kodu ata.
update public.profiles
set davet_kodu = substr(replace(id::text, '-', ''), 1, 8)
where davet_kodu is null;

-- Bu satır eklenmeden önce kayıt olmuş kullanıcıların coins satırı yoktu, açalım.
insert into public.coins (user_id, bakiye)
select p.id, 0
from public.profiles p
where not exists (select 1 from public.coins c where c.user_id = p.id);

-- ============================================================
-- handle_new_user'ı davet kodu üretecek ve davet bonusu verecek
-- şekilde güncelliyoruz.
-- ============================================================

create or replace function public.handle_new_user()
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
