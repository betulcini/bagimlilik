import { supabase } from './client';

/** Kullanıcının aktif alışkanlığını getirir (yoksa null döner). */
export async function getActiveHabit(userId) {
	const { data, error } = await supabase
		.from('habits')
		.select('*')
		.eq('user_id', userId)
		.eq('aktif_mi', true)
		.order('başlangıç_tarihi', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	return data;
}

/** Yeni bir alışkanlık kaydı oluşturur ve aktif yapar. */
export async function createHabit(userId, { alışkanlık_adı, başlangıç_tarihi, günlük_tasarruf_miktarı }) {
	const { data, error } = await supabase
		.from('habits')
		.insert({
			user_id: userId,
			alışkanlık_adı,
			başlangıç_tarihi,
			günlük_tasarruf_miktarı: günlük_tasarruf_miktarı ?? 0,
			aktif_mi: true,
			en_uzun_seri: '0'
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Nüks kaydeder: mevcut seriyi en_uzun_seri ile karşılaştırıp gerekirse günceller,
 * relapses tablosuna satır ekler, başlangıç_tarihi'ni şimdiki zamana çeker (sayaç sıfırlanır).
 */
export async function recordRelapse(habit, not_) {
	const now = new Date();
	const başlangıç = new Date(habit.başlangıç_tarihi);
	const geçenSüreMs = now.getTime() - başlangıç.getTime();
	const geçenInterval = `${Math.floor(geçenSüreMs / 1000)} seconds`;

	const enUzunMevcutSaniye = parsePgIntervalToSeconds(habit.en_uzun_seri);
	const geçenSaniye = Math.floor(geçenSüreMs / 1000);
	const yeniEnUzun = geçenSaniye > enUzunMevcutSaniye ? geçenInterval : habit.en_uzun_seri;

	const { error: relapseError } = await supabase.from('relapses').insert({
		habit_id: habit.id,
		tarih: now.toISOString(),
		not_: not_ ?? null
	});
	if (relapseError) throw relapseError;

	const { data, error } = await supabase
		.from('habits')
		.update({
			başlangıç_tarihi: now.toISOString(),
			en_uzun_seri: yeniEnUzun
		})
		.eq('id', habit.id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

/** PostgreSQL interval string'ini ("3 days 02:15:00" gibi) saniyeye çevirir. */
export function parsePgIntervalToSeconds(interval) {
	if (!interval) return 0;
	if (typeof interval === 'number') return interval;

	// "X seconds" formatı (bizim yazdığımız)
	const secondsMatch = interval.match(/^(\d+(\.\d+)?) seconds?$/);
	if (secondsMatch) return Math.floor(parseFloat(secondsMatch[1]));

	// Postgres'in döndürebileceği "3 days 02:15:00" formatı
	let total = 0;
	const dayMatch = interval.match(/(\d+)\s+days?/);
	if (dayMatch) total += parseInt(dayMatch[1], 10) * 86400;

	const timeMatch = interval.match(/(\d{2}):(\d{2}):(\d{2})/);
	if (timeMatch) {
		total += parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60 + parseInt(timeMatch[3], 10);
	}
	return total;
}
