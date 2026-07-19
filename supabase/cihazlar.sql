-- ============================================================
-- Akıllı priz / cihaz bağlama sistemi
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli.

create table public.cihazlar (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	cihaz_adı text not null,
	cihaz_kodu text not null unique, -- ESP32'nin firmware'ine gireceğin gizli eşleştirme kodu
	fiş_kapali boolean not null default false,
	nukste_otomatik_kes boolean not null default false,
	son_görülme timestamptz,
	oluşturulma_tarihi timestamptz not null default now()
);

alter table public.cihazlar enable row level security;

-- Web sitesinden: SADECE kendi cihazına erişim (normal kullanıcı girişiyle)
create policy "cihazlar_owner_all" on public.cihazlar
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- ESP32 için güvenli fonksiyonlar (giriş yapmadan, sadece cihaz_kodu ile çalışır)
-- ============================================================
-- ESP32 kullanıcı olarak giriş yapamaz, bu yüzden tabloya doğrudan
-- erişemiyor (RLS engelliyor). Bunun yerine, sadece doğru cihaz_kodu'nu
-- bilen biri için dar kapsamlı iki fonksiyon açıyoruz.

-- ESP32 birkaç saniyede bir bunu çağırır: "benim için bir komut var mı?"
create or replace function public.cihaz_durumu_oku(p_kod text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
	v_durum boolean;
begin
	update public.cihazlar
	set son_görülme = now()
	where cihaz_kodu = p_kod
	returning fiş_kapali into v_durum;

	return coalesce(v_durum, false);
end;
$$;

grant execute on function public.cihaz_durumu_oku(text) to anon, authenticated;
