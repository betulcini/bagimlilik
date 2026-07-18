import { supabase } from './client';

/** Kullanıcının bonus coin bakiyesini getirir (davet + ana ekrana ekleme bonusları). */
export async function getBonusBakiye(userId) {
	const { data, error } = await supabase.from('coins').select('bakiye').eq('user_id', userId).maybeSingle();
	if (error) throw error;
	return data?.bakiye ?? 0;
}

/** Kullanıcının davet kodunu ve daha önce ana ekran bonusu alıp almadığını getirir. */
export async function getDavetProfil(userId) {
	const { data, error } = await supabase
		.from('profiles')
		.select('davet_kodu, anasayfa_bonus_alindi')
		.eq('id', userId)
		.single();
	if (error) throw error;
	return data;
}

const ANASAYFA_BONUS = 20;

/**
 * Site ana ekrana/kısayola eklenmiş şekilde (standalone modda) açıldığında,
 * kullanıcı bu bonusu daha önce almadıysa bir kereliğine coin verir.
 */
export async function anasayfaBonusuVerVarsaGerek(userId) {
	const profil = await getDavetProfil(userId);
	if (profil.anasayfa_bonus_alindi) return false;

	const { error: profilError } = await supabase
		.from('profiles')
		.update({ anasayfa_bonus_alindi: true })
		.eq('id', userId);
	if (profilError) throw profilError;

	const mevcutBakiye = await getBonusBakiye(userId);
	const { error: coinError } = await supabase
		.from('coins')
		.update({ bakiye: mevcutBakiye + ANASAYFA_BONUS, son_güncelleme: new Date().toISOString() })
		.eq('user_id', userId);
	if (coinError) throw coinError;

	return true;
}

export { ANASAYFA_BONUS };
