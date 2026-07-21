import { supabase } from './client';

export async function getCheckinsSince(habitId, sinceIso) {
	const { data, error } = await supabase
		.from('checkins')
		.select('*')
		.eq('habit_id', habitId)
		.gte('tarih', sinceIso)
		.order('tarih', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

export async function getRelapsesSince(habitId, sinceIso) {
	const { data, error } = await supabase
		.from('relapses')
		.select('*')
		.eq('habit_id', habitId)
		.gte('tarih', sinceIso)
		.order('tarih', { ascending: false });
	if (error) throw error;
	return data ?? [];
}
