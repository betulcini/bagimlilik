import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** Gelen isteğin geçerli, oturum açmış bir Supabase kullanıcısına ait olup olmadığını doğrular. */
async function kullanıcıDoğrula(request) {
	const yetkiBaşlığı = request.headers.get('authorization');
	if (!yetkiBaşlığı) return false;

	try {
		const res = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/user`, {
			headers: { apikey: PUBLIC_SUPABASE_ANON_KEY, authorization: yetkiBaşlığı }
		});
		return res.ok;
	} catch {
		return false;
	}
}

const SISTEM_PROMPTU = {
	tr: `Sen bir bağımlılıkla mücadele uygulamasında kullanıcıya kısa, destekleyici bir haftalık/aylık özet yazan bir asistansın.
Kurallar:
- Türkçe yaz, 2-3 cümleyi geçme.
- Kullanıcıya doğrudan "sen" diliyle hitap et.
- ASLA tıbbi teşhis, psikolojik durum ismi (örn. "depresyon", "anksiyete") kullanma.
- ASLA suçlayıcı ya da yargılayıcı olma; ton her zaman sıcak ve teşvik edici olsun.
- Sadece verilen sayısal/metinsel örüntüleri (hangi günler zor geçmiş, ruh hali eğilimi vb.) yansıt, veri dışı varsayımlarda bulunma.
- Somut bir öneriyle bitir (örn. "bu hafta X'e dikkat etmeyi dene" gibi kısa, nazik bir cümle).
- Sadece düz metin döndür, markdown/liste kullanma.`,
	en: `You are an assistant in an addiction-recovery app writing a short, supportive weekly/monthly summary for the user.
Rules:
- Write in English, no more than 2-3 sentences.
- Address the user directly ("you").
- NEVER use medical diagnoses or psychological condition names (e.g. "depression", "anxiety").
- NEVER be judgmental or blaming; tone must always be warm and encouraging.
- Only reflect the numeric/textual patterns given (which days were hard, mood trend, etc.), don't assume anything beyond the data.
- End with a concrete, gentle tip (e.g. "try to watch out for X this week").
- Return plain text only, no markdown/lists.`
};

export async function POST({ request, platform }) {
	if (!(await kullanıcıDoğrula(request))) {
		return json({ hata: 'Yetkisiz istek.' }, { status: 401 });
	}

	const gövde = await request.json();
	const { periyot, checkinOrani, ortalamaMood, seriBozmaSayisi, nefesSeansiSayisi, tetikleyiciNotlari, dil } = gövde;
	const seçiliDil = dil === 'en' ? 'en' : 'tr';

	if (!platform?.env?.AI) {
		return json({
			özet:
				seçiliDil === 'en'
					? 'To see this feature, open the site from its live (Cloudflare) address — Workers AI does not work in local development.'
					: 'Bu özelliği görebilmek için siteyi canlı (Cloudflare) adresinden açman gerekiyor — yerel geliştirme ortamında Workers AI çalışmıyor.',
			yerelFallback: true
		});
	}

	const notlarMetni =
		tetikleyiciNotlari && tetikleyiciNotlari.length > 0
			? tetikleyiciNotlari.slice(0, 8).join(' | ')
			: seçiliDil === 'en'
				? 'No trigger notes entered.'
				: 'Herhangi bir tetikleyici notu girilmemiş.';

	const kullanıcıMesajı =
		seçiliDil === 'en'
			? `Period: ${periyot} days
Check-in rate: ${checkinOrani}%
Average mood (1-5): ${ortalamaMood ?? 'no data'}
Relapse count: ${seriBozmaSayisi}
Breathing exercise sessions completed: ${nefesSeansiSayisi ?? 0}
Trigger notes: ${notlarMetni}

Based on this data, write a short summary/insight for the user.`
			: `Periyot: ${periyot} gün
Check-in oranı: %${checkinOrani}
Ortalama ruh hali (1-5): ${ortalamaMood ?? 'veri yok'}
Seri bozma (nüks) sayısı: ${seriBozmaSayisi}
Tamamlanan nefes egzersizi seansı: ${nefesSeansiSayisi ?? 0}
Tetikleyici notları: ${notlarMetni}

Bu verilere göre kullanıcıya kısa bir özet/içgörü yaz.`;

	try {
		const yanıt = await platform.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{ role: 'system', content: SISTEM_PROMPTU[seçiliDil] },
				{ role: 'user', content: kullanıcıMesajı }
			],
			max_tokens: 220
		});

		return json({ özet: yanıt.response?.trim() ?? '' });
	} catch (e) {
		return json({ özet: '', hata: e.message }, { status: 500 });
	}
}
