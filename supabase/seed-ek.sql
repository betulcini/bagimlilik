-- ============================================================
-- Daha önce seed.sql'i (eski 4 eşyalı hâliyle) çalıştırdıysan
-- sadece BU dosyayı çalıştır — mevcut 4 eşyayı tekrar eklemez,
-- üstüne 6 yeni eşya ekler. seed.sql'i tekrar çalıştırma,
-- yoksa "Basit Halı" gibi eşyalar iki kere eklenir.
-- ============================================================

insert into public.house_items (ad, kategori, fiyat, gerekli_gün_sayısı, görsel_referans, nadir_mi) values
	('Minimal Kilim', 'zemin', 35, 3, 'kilim', false),
	('Büyük Yapraklı Bitki', 'bitki', 30, 3, 'buyuk_bitki', false),
	('Rahat Koltuk', 'mobilya', 60, 14, 'koltuk', false),
	('Kitaplık', 'mobilya', 70, 21, 'kitaplik', false),
	('Duvar Saati', 'dekor', 45, 10, 'saat', false),
	('Zafer Kupası', 'dekor', 150, 90, 'kupa', true);
