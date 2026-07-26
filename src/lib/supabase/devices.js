import { supabase } from './client';

export async function getCihazlar(userId) {
	const { data, error } = await supabase
		.from('cihazlar')
		.select('*')
		.eq('user_id', userId)
		.order('oluşturulma_tarihi', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

function rastgeleKodÜret() {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

/**
 * Kategori ve günlük limit (dakika) alır.
 * cihazEkle(userId, { cihaz_adı, kategori, limit_dakika })
 */
export async function cihazEkle(userId, { cihaz_adı, kategori, limit_dakika }) {
	const { data, error } = await supabase
		.from('cihazlar')
		.insert({
			user_id: userId,
			cihaz_adı,
			kategori: kategori || 'Diğer',
			limit_dakika: limit_dakika || 60,
			baslangic_zamani: new Date().toISOString(),
			cihaz_kodu: rastgeleKodÜret()
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function cihazGüncelle(id, alanlar) {
	const { data, error } = await supabase.from('cihazlar').update(alanlar).eq('id', id).select().single();
	if (error) throw error;
	return data;
}

export async function cihazSil(id) {
	const { error } = await supabase.from('cihazlar').delete().eq('id', id);
	if (error) throw error;
}

/** Nüks anında, "nükste otomatik kes" işaretli tüm cihazların fişini kapatır. */
export async function nükstePrizleriKapat(userId) {
	const { error } = await supabase
		.from('cihazlar')
		.update({ fiş_kapali: true })
		.eq('user_id', userId)
		.eq('nukste_otomatik_kes', true);
	if (error) throw error;
}

export function cihazÇevrimİçiMi(cihaz) {
	if (!cihaz.son_görülme) return false;
	return Date.now() - new Date(cihaz.son_görülme).getTime() < 15000; // son 15 saniyede haber vermiş mi
}

// ---- süre/limit sistemi ----

/** Kalan saniyeyi client tarafında hesaplar (DB'ye her saniye yazmıyoruz, sadece anlık hesaplıyoruz). */
export function cihazKalanSaniye(cihaz) {
	if (cihaz.fiş_kapali) return 0;
	if (!cihaz.limit_dakika || !cihaz.baslangic_zamani) return 0;
	const geçenSaniye = (Date.now() - new Date(cihaz.baslangic_zamani).getTime()) / 1000;
	const kalan = cihaz.limit_dakika * 60 - geçenSaniye;
	return Math.max(0, Math.round(kalan));
}

/** "+15 Dk Ekle" — coins tablosundan 1 coin düşer, yetmiyorsa hata fırlatır. */
export async function cihazSureEkle(cihazId, userId, dakika = 15) {
	const { data: coinSatırı, error: coinOkumaHatası } = await supabase
		.from('coins')
		.select('bakiye')
		.eq('user_id', userId)
		.single();
	if (coinOkumaHatası) throw coinOkumaHatası;

	if (!coinSatırı || coinSatırı.bakiye < 1) {
		throw new Error('Yetersiz coin bakiyesi');
	}

	const { error: coinGüncelleHatası } = await supabase
		.from('coins')
		.update({ bakiye: coinSatırı.bakiye - 1, son_güncelleme: new Date().toISOString() })
		.eq('user_id', userId);
	if (coinGüncelleHatası) throw coinGüncelleHatası;

	const { data: cihaz, error: okumaHatası } = await supabase
		.from('cihazlar')
		.select('limit_dakika')
		.eq('id', cihazId)
		.single();
	if (okumaHatası) throw okumaHatası;

	return cihazGüncelle(cihazId, { limit_dakika: cihaz.limit_dakika + dakika, fiş_kapali: false });
}

/** "Fişi Çek" — süreyi beklemeden anında kapatır. */
export async function cihazFisiKes(cihazId) {
	return cihazGüncelle(cihazId, { fiş_kapali: true });
}
