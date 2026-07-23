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

export async function POST({ request, platform }) {
	if (!(await kullanıcıDoğrula(request))) {
		return json({ hata: 'Yetkisiz istek.' }, { status: 401 });
	}

	const gövde = await request.json();
	const { şikayetEdenKullanıcıAdı, şikayetEdilenKullanıcıAdı, mesajİçeriği, sebep } = gövde;

	const apiKey = platform?.env?.RESEND_API_KEY;
	const adminEposta = platform?.env?.ADMIN_EMAIL;

	// Resend/admin e-postası ayarlanmamışsa sessizce geç — şikayet zaten
	// veritabanına kaydedildi, bu sadece ek bir bildirim, kritik değil.
	if (!apiKey || !adminEposta) {
		return json({ gönderildi: false, sebep: 'Bildirim ayarlanmamış.' });
	}

	const html = `
		<div style="font-family:sans-serif;max-width:520px">
			<h2 style="color:#b5482f">Yeni bir şikayet geldi</h2>
			<p><strong>Şikayet eden:</strong> ${şikayetEdenKullanıcıAdı ?? 'bilinmiyor'}</p>
			<p><strong>Şikayet edilen:</strong> ${şikayetEdilenKullanıcıAdı ?? 'bilinmiyor'}</p>
			<p><strong>Şikayet edilen mesaj:</strong></p>
			<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${mesajİçeriği ?? ''}</blockquote>
			<p><strong>Sebep:</strong> ${sebep || '(belirtilmemiş)'}</p>
			<p style="color:#888;font-size:0.85em">Detayları incelemek için Supabase panelinde Table Editor &gt; sikayetler tablosuna bak.</p>
		</div>
	`;

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: platform?.env?.GONDEREN_ADRES ?? 'Ev Dön <onboarding@resend.dev>',
				to: adminEposta,
				subject: 'Yeni şikayet bildirimi — Ev Dön',
				html
			})
		});

		if (!res.ok) {
			const hataMetni = await res.text();
			return json({ gönderildi: false, hata: hataMetni }, { status: 500 });
		}

		return json({ gönderildi: true });
	} catch (e) {
		return json({ gönderildi: false, hata: e.message }, { status: 500 });
	}
}
