import { supabase } from './client';

export async function şikayetGönder({ şikayetEdenId, şikayetEdilenId, mesajId, mesajİçeriği, sebep }) {
	const { error } = await supabase.from('sikayetler').insert({
		şikayet_eden_id: şikayetEdenId,
		şikayet_edilen_id: şikayetEdilenId,
		mesaj_id: mesajId ?? null,
		mesaj_icerigi_kopya: mesajİçeriği ?? null,
		sebep: sebep?.trim() || null
	});
	if (error) throw error;
}
