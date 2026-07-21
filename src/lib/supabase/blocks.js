import { supabase } from './client';

/** Kendi engellediğim kullanıcıların id'lerini (ve tarihini) getirir. Profil bilgisi ayrıca çekilmeli. */
export async function getEngellenenler(userId) {
	const { data, error } = await supabase
		.from('engellemeler')
		.select('id, engellenen_id, tarih')
		.eq('engelleyen_id', userId)
		.order('tarih', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function engelle(userId, hedefId) {
	const { error } = await supabase.from('engellemeler').insert({ engelleyen_id: userId, engellenen_id: hedefId });
	if (error) throw error;
}

export async function engelKaldır(userId, hedefId) {
	const { error } = await supabase
		.from('engellemeler')
		.delete()
		.eq('engelleyen_id', userId)
		.eq('engellenen_id', hedefId);
	if (error) throw error;
}
