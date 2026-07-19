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

export async function cihazEkle(userId, cihazAdı) {
	const { data, error } = await supabase
		.from('cihazlar')
		.insert({ user_id: userId, cihaz_adı: cihazAdı, cihaz_kodu: rastgeleKodÜret() })
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
