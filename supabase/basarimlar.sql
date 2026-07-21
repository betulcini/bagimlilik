-- ============================================================
-- Rozet/başarım kataloğu (bir kere çalıştırman yeterli)
-- ============================================================
-- Not: user_achievements ve achievements tabloları zaten schema.sql'de
-- vardı (RLS'leri de dahil), burada sadece rozet kataloğunu dolduruyoruz.

insert into public.achievements (ad, açıklama, gerekli_gün_sayısı, ikon) values
	('İlk 24 Saat', 'İlk temiz gününü tamamladın.', 1, 'ilk-adim'),
	('3 Gün', 'Üç gün boyunca temiz kaldın.', 3, 'uc-gun'),
	('1 Hafta', 'Bir haftalık temiz seriye ulaştın.', 7, 'bir-hafta'),
	('1 Ay', 'Bir aylık temiz seriye ulaştın.', 30, 'bir-ay'),
	('3 Ay', 'Üç aylık temiz seriye ulaştın.', 90, 'uc-ay'),
	('6 Ay', 'Altı aylık temiz seriye ulaştın.', 180, 'alti-ay'),
	('1 Yıl', 'Bir yıllık temiz seriye ulaştın — büyük başarı!', 365, 'bir-yil');
