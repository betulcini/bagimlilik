import { json } from '@sveltejs/kit';

const SISTEM_PROMPTU = `Sen bir bağımlılıkla mücadele uygulamasında kullanıcıya günlük tek cümlelik motivasyon mesajı yazan bir asistansın.
Kurallar:
- Türkçe yaz, TEK cümle olsun, en fazla 20-25 kelime.
- Kullanıcıya doğrudan "sen" diliyle hitap et, samimi ve sıcak ol.
- ASLA tıbbi teşhis veya psikolojik durum ismi kullanma.
- ASLA suçlayıcı olma. Klişe/kalıp cümleler yerine, verilen gün sayısına ve ruh haline özgü, somut bir cümle kur.
- Sadece düz metin döndür, tırnak işareti veya markdown kullanma.`;

export async function POST({ request, platform }) {
	const gövde = await request.json();
	const { günSayısı, sonMood, alışkanlıkAdı } = gövde;

	if (!platform?.env?.AI) {
		return json({
			mesaj: 'Bugün de burada olduğun için teşekkürler — her gün bir adım daha ileri gidiyorsun.',
			yerelFallback: true
		});
	}

	const kullanıcıMesajı = `Alışkanlık: ${alışkanlıkAdı}
Temiz gün sayısı: ${günSayısı}
Son check-in ruh hali (1=çok kötü, 5=harika): ${sonMood ?? 'henüz check-in yapmamış'}

Bu bilgilere göre bugün için kısa bir motivasyon cümlesi yaz.`;

	try {
		const yanıt = await platform.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
			messages: [
				{ role: 'system', content: SISTEM_PROMPTU },
				{ role: 'user', content: kullanıcıMesajı }
			],
			max_tokens: 80
		});

		return json({ mesaj: yanıt.response?.trim() ?? '' });
	} catch (e) {
		return json({ mesaj: '', hata: e.message }, { status: 500 });
	}
}
