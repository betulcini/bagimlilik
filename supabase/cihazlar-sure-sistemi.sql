-- ============================================================
-- Cihazlara kategori + süre/limit sistemi
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli (cihazlar.sql'den SONRA).

alter table public.cihazlar
	add column if not exists kategori text default 'Diğer',
	add column if not exists limit_dakika integer not null default 60,
	add column if not exists baslangic_zamani timestamptz default now();

-- Açıklama:
-- kategori         → "Oyun Konsolu" | "Bilgisayar" | "Akıllı TV" | "Modem" | "Diğer"
-- limit_dakika     → o oturum için izin verilen toplam süre (dakika)
-- baslangic_zamani → o anki sürenin sayılmaya başladığı zaman damgası
--                     (fiş açıldığında veya süre eklendiğinde güncellenir)
--
-- Kalan süre = limit_dakika*60 - (şimdi - baslangic_zamani, saniye cinsinden)

-- ============================================================
-- ESP32'nin okuduğu fonksiyonu süre dolunca da "kapalı" dönecek
-- şekilde güncelliyoruz — böylece tarayıcı açık olmasa bile,
-- süre bittiğinde cihaz otomatik kapanır.
-- ============================================================

create or replace function public.cihaz_durumu_oku(p_kod text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
	v_fiş_kapali boolean;
	v_limit_dakika integer;
	v_baslangic_zamani timestamptz;
	v_süre_doldu boolean;
begin
	update public.cihazlar
	set son_görülme = now()
	where cihaz_kodu = p_kod
	returning fiş_kapali, limit_dakika, baslangic_zamani
	into v_fiş_kapali, v_limit_dakika, v_baslangic_zamani;

	if not found then
		return false;
	end if;

	v_süre_doldu := v_limit_dakika is not null and v_baslangic_zamani is not null
		and (extract(epoch from (now() - v_baslangic_zamani)) > v_limit_dakika * 60);

	return coalesce(v_fiş_kapali, false) or coalesce(v_süre_doldu, false);
end;
$$;
