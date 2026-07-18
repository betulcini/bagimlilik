import { supabase } from './client';

/** Kullanıcının gönderdiği/aldığı tüm mesajları kronolojik sırayla getirir. */
export async function getMesajlar(userId) {
	const { data, error } = await supabase
		.from('messages')
		.select('*')
		.or(`gönderen_id.eq.${userId},alıcı_id.eq.${userId}`)
		.order('tarih', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

export async function mesajGönder(gönderenId, alıcıId, içerik, tip = 'motivasyon') {
	const { data, error } = await supabase
		.from('messages')
		.insert({ gönderen_id: gönderenId, alıcı_id: alıcıId, içerik, tip })
		.select()
		.single();
	if (error) throw error;
	return data;
}

/** Aynı alışkanlığı bırakan, daha önce eşleşilmemiş rastgele bir kullanıcı bulur (bkz. functions.sql). */
export async function anonimEşleş(alışkanlıkAdı) {
	const { data, error } = await supabase.rpc('bul_anonim_eslesme', { p_alışkanlık_adı: alışkanlıkAdı });
	if (error) throw error;
	return data?.[0] ?? null;
}
