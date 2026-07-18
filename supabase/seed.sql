-- ============================================================
-- Başlangıç eşya kataloğu (bir kere çalıştırman yeterli)
-- ============================================================

insert into public.house_items (ad, kategori, fiyat, gerekli_gün_sayısı, görsel_referans, nadir_mi) values
	('Basit Halı', 'zemin', 20, 0, 'hali', false),
	('Minimal Kilim', 'zemin', 35, 3, 'kilim', false),
	('Saksı Bitki', 'bitki', 15, 0, 'saksi', false),
	('Büyük Yapraklı Bitki', 'bitki', 30, 3, 'buyuk_bitki', false),
	('Ahşap Sandalye', 'mobilya', 40, 7, 'sandalye', true),
	('Rahat Koltuk', 'mobilya', 60, 14, 'koltuk', false),
	('Kitaplık', 'mobilya', 70, 21, 'kitaplik', false),
	('Duvar Saati', 'dekor', 45, 10, 'saat', false),
	('Altın Çerçeveli Tablo', 'dekor', 100, 30, 'tablo', true),
	('Zafer Kupası', 'dekor', 150, 90, 'kupa', true);
