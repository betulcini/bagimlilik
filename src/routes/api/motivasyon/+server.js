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
	tr: `Sen bir bağımlılıkla mücadele uygulamasında kullanıcıya günlük tek cümlelik motivasyon mesajı yazan bir asistansın.

DİL KURALI (EN ÖNEMLİ KURAL): SADECE ve TAMAMEN Türkçe yaz. Tek bir İngilizce, Almanca ya da başka bir dilden kelime bile KULLANMA — cümle ortasında dil değiştirme, kelime karıştırma YASAK.

Diğer kurallar:
- TEK cümle olsun, en fazla 20-25 kelime.
- Kullanıcıya doğrudan "sen" diliyle hitap et, samimi ve sıcak ol.
- ASLA tıbbi teşhis veya psikolojik durum ismi kullanma.
- ASLA suçlayıcı olma. Klişe/kalıp cümleler yerine, verilen gün sayısına ve ruh haline özgü, somut bir cümle kur.
- Sadece düz metin döndür, tırnak işareti veya markdown kullanma.

Unutma: yanıtının HER kelimesi Türkçe olmalı.`,
	en: `You are an assistant in an addiction-recovery app writing a one-sentence daily motivational message for the user.

LANGUAGE RULE (MOST IMPORTANT RULE): Write ENTIRELY and ONLY in English. Do NOT use a single word from Turkish, German, or any other language — no mid-sentence language switching, no mixed words.

Other rules:
- ONE sentence only, at most 20-25 words.
- Address the user directly ("you"), warm and genuine tone.
- NEVER use medical diagnoses or psychological condition names.
- NEVER be judgmental. Avoid generic clichés — write something concrete, tied to the given day count and mood.
- Return plain text only, no quotes or markdown.

Remember: every single word of your response must be in English.`
};

const DİL_HATIRLATMASI = {
	tr: '\n\n(Hatırlatma: yanıtını SADECE Türkçe yaz, başka dilden tek kelime bile katma.)',
	en: '\n\n(Reminder: write your response ONLY in English, do not add a single word from another language.)'
};

export async function POST({ request, platform }) {
	if (!(await kullanıcıDoğrula(request))) {
		return json({ hata: 'Yetkisiz istek.' }, { status: 401 });
	}

	const gövde = await request.json();
	const { günSayısı, sonMood, alışkanlıkAdı, dil } = gövde;
	const seçiliDil = dil === 'en' ? 'en' : 'tr';

	if (!platform?.env?.AI) {
		return json({
			mesaj:
				seçiliDil === 'en'
					? "Thanks for being here today — you're moving one step further every day."
					: 'Bugün de burada olduğun için teşekkürler — her gün bir adım daha ileri gidiyorsun.',
			yerelFallback: true
		});
	}

	const kullanıcıMesajı =
		seçiliDil === 'en'
			? `Habit: ${alışkanlıkAdı}
Clean day count: ${günSayısı}
Last check-in mood (1=very bad, 5=great): ${sonMood ?? 'no check-in yet'}

Based on this, write a short motivational sentence for today.`
			: `Alışkanlık: ${alışkanlıkAdı}
Temiz gün sayısı: ${günSayısı}
Son check-in ruh hali (1=çok kötü, 5=harika): ${sonMood ?? 'henüz check-in yapmamış'}

Bu bilgilere göre bugün için kısa bir motivasyon cümlesi yaz.`;

	try {
		const yanıt = await platform.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{ role: 'system', content: SISTEM_PROMPTU[seçiliDil] },
				{ role: 'user', content: kullanıcıMesajı + DİL_HATIRLATMASI[seçiliDil] }
			],
			max_tokens: 80,
			temperature: 0.3
		});

		return json({ mesaj: yanıt.response?.trim() ?? '' });
	} catch (e) {
		return json({ mesaj: '', hata: e.message }, { status: 500 });
	}
}
