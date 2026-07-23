import { supabase } from './client';

export async function seansKaydet(userId, teknikId, tamamlananTur, toplamSaniye) {
	if (toplamSaniye <= 0) return null; // hiç ilerleme yoksa kaydetmeye değmez
	const { data, error } = await supabase
		.from('nefes_seanslari')
		.insert({
			user_id: userId,
			teknik_id: teknikId,
			tamamlanan_tur: tamamlananTur,
			toplam_saniye: toplamSaniye
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function getSeanslarSince(userId, sinceIso) {
	const { data, error } = await supabase
		.from('nefes_seanslari')
		.select('*')
		.eq('user_id', userId)
		.gte('tarih', sinceIso)
		.order('tarih', { ascending: false });
	if (error) throw error;
	return data ?? [];
}
