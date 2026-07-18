import { supabase } from './client';

/** Eşya kataloğunu getirir. */
export async function getHouseItems() {
	const { data, error } = await supabase.from('house_items').select('*').order('fiyat', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

/** Bir kullanıcının sahip olduğu tüm eşyaları (kataloğuyla birlikte) getirir. */
export async function getUserHouse(userId) {
	const { data, error } = await supabase
		.from('user_house')
		.select('*, house_items(*)')
		.eq('user_id', userId);
	if (error) throw error;
	return data ?? [];
}

/** Başka bir kullanıcının SADECE evini getirir (sosyal/keşif sayfası için). */
export async function getPublicUserHouse(userId) {
	return getUserHouse(userId);
}

/** Eşya satın alır, envantere ekler (henüz grid'e yerleştirilmemiş: konum -1,-1). */
export async function purchaseItem(userId, itemId) {
	const { data, error } = await supabase
		.from('user_house')
		.insert({ user_id: userId, item_id: itemId, konum_x: -1, konum_y: -1 })
		.select('*, house_items(*)')
		.single();
	if (error) throw error;
	return data;
}

/** Envanterdeki bir eşyayı grid üzerindeki bir hücreye yerleştirir. */
export async function placeItem(userHouseId, x, y) {
	const { data, error } = await supabase
		.from('user_house')
		.update({ konum_x: x, konum_y: y })
		.eq('id', userHouseId)
		.select('*, house_items(*)')
		.single();
	if (error) throw error;
	return data;
}

/** Grid'deki bir eşyayı geri envantere alır (konumunu sıfırlar). */
export async function pickUpItem(userHouseId) {
	return placeItem(userHouseId, -1, -1);
}
