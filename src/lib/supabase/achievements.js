import { supabase } from './client';

export async function getBasarimlar() {
	const { data, error } = await supabase.from('achievements').select('*').order('gerekli_gün_sayısı', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

export async function getKullanıcıBasarımları(userId) {
	const { data, error } = await supabase
		.from('user_achievements')
		.select('*, achievements(*)')
		.eq('user_id', userId);
	if (error) throw error;
	return data ?? [];
}

/**
 * Kullanıcının mevcut temiz gün sayısına göre henüz kazanmadığı ama
 * hakettiği rozetleri user_achievements'a ekler. Yeni kazanılan
 * rozetlerin listesini döner (kutlama/toast göstermek için).
 */
export async function eksikRozetleriVer(userId, günSayısı) {
	const [kataloglar, kazanılmışlar] = await Promise.all([getBasarimlar(), getKullanıcıBasarımları(userId)]);

	const kazanılmışIdSet = new Set(kazanılmışlar.map((k) => k.achievement_id));
	const hakEdilenYeniler = kataloglar.filter((a) => günSayısı >= a.gerekli_gün_sayısı && !kazanılmışIdSet.has(a.id));

	if (hakEdilenYeniler.length === 0) return [];

	const { error } = await supabase
		.from('user_achievements')
		.insert(hakEdilenYeniler.map((a) => ({ user_id: userId, achievement_id: a.id })));
	if (error) throw error;

	return hakEdilenYeniler;
}
