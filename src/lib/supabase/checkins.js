import { supabase } from './client';

/** Bugüne ait check-in var mı diye bakar (günde bir check-in mantığı için). */
export async function getTodayCheckin(habitId) {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const { data, error } = await supabase
		.from('checkins')
		.select('*')
		.eq('habit_id', habitId)
		.gte('tarih', startOfDay.toISOString())
		.order('tarih', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	return data;
}

export async function addCheckin(habitId, mood, tetikleyici_notu) {
	const { data, error } = await supabase
		.from('checkins')
		.insert({
			habit_id: habitId,
			tarih: new Date().toISOString(),
			mood,
			tetikleyici_notu: tetikleyici_notu || null
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

/** Son N check-in kaydını getirir (geçmiş listesi için). */
export async function getRecentCheckins(habitId, limit = 14) {
	const { data, error } = await supabase
		.from('checkins')
		.select('*')
		.eq('habit_id', habitId)
		.order('tarih', { ascending: false })
		.limit(limit);

	if (error) throw error;
	return data ?? [];
}
