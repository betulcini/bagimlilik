import { supabase } from './client';

/** Kendi dışındaki tüm kullanıcı profillerini getirir (sadece kullanıcı adı — herkese açık alan). */
export async function getDiğerProfiller(kendiUserId, limit = 24) {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, kullanici_adi, olusturulma_tarihi')
		.neq('id', kendiUserId)
		.order('olusturulma_tarihi', { ascending: false })
		.limit(limit);
	if (error) throw error;
	return data ?? [];
}

/** Birden fazla kullanıcı id'sinden profil bilgilerini tek seferde getirir. */
export async function getProfillerByIds(idList) {
	if (idList.length === 0) return [];
	const { data, error } = await supabase.from('profiles').select('id, kullanici_adi').in('id', idList);
	if (error) throw error;
	return data ?? [];
}

/** Birden fazla kullanıcının user_house kayıtlarını tek seferde getirir (galeri önizlemesi için). */
export async function getTopluUserHouse(userIdList) {
	if (userIdList.length === 0) return [];
	const { data, error } = await supabase
		.from('user_house')
		.select('*, house_items(*)')
		.in('user_id', userIdList);
	if (error) throw error;
	return data ?? [];
}
