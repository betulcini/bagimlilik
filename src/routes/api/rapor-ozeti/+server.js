import { json } from '@sveltejs/kit';

const SISTEM_PROMPTU = `Sen bir bağımlılıkla mücadele uygulamasında kullanıcıya kısa, destekleyici bir haftalık/aylık özet yazan bir asistansın.
Kurallar:
- Türkçe yaz, 2-3 cümleyi geçme.
- Kullanıcıya doğrudan "sen" diliyle hitap et.
- ASLA tıbbi teşhis, psikolojik durum ismi (örn. "depresyon", "anksiyete") kullanma.
- ASLA suçlayıcı ya da yargılayıcı olma; ton her zaman sıcak ve teşvik edici olsun.
- Sadece verilen sayısal/metinsel örüntüleri (hangi günler zor geçmiş, ruh hali eğilimi vb.) yansıt, veri dışı varsayımlarda bulunma.
- Somut bir öneriyle bitir (örn. "bu hafta X'e dikkat etmeyi dene" gibi kısa, nazik bir cümle).
- Sadece düz metin döndür, markdown/liste kullanma.`;

export async function POST({ request, platform }) {
	const gövde = await request.json();
	const { periyot, checkinOrani, ortalamaMood, seriBozmaSayisi, tetikleyiciNotlari } = gövde;

	if (!platform?.env?.AI) {
		return json({
			özet:
				'Bu özelliği görebilmek için siteyi canlı (Cloudflare) adresinden açman gerekiyor — yerel geliştirme ortamında Workers AI çalışmıyor.',
			yerelFallback: true
		});
	}

	const notlarMetni =
		tetikleyiciNotlari && tetikleyiciNotlari.length > 0
			? tetikleyiciNotlari.slice(0, 8).join(' | ')
			: 'Herhangi bir tetikleyici notu girilmemiş.';

	const kullanıcıMesajı = `Periyot: ${periyot} gün
Check-in oranı: %${checkinOrani}
Ortalama ruh hali (1-5): ${ortalamaMood ?? 'veri yok'}
Seri bozma (nüks) sayısı: ${seriBozmaSayisi}
Tetikleyici notları: ${notlarMetni}

Bu verilere göre kullanıcıya kısa bir özet/içgörü yaz.`;

	try {
		const yanıt = await platform.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
			messages: [
				{ role: 'system', content: SISTEM_PROMPTU },
				{ role: 'user', content: kullanıcıMesajı }
			],
			max_tokens: 220
		});

		return json({ özet: yanıt.response?.trim() ?? '' });
	} catch (e) {
		return json({ özet: '', hata: e.message }, { status: 500 });
	}
}
