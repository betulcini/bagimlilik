-- ============================================================
-- Seri hedefi (kullanıcının kendine koyduğu gün hedefi)
-- ============================================================
-- Bunu bir kere SQL Editor'de çalıştırman yeterli.

alter table public.habits add column if not exists hedef_gun_sayisi integer;
