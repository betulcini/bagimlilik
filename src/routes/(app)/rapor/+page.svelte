<script>
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getActiveHabit } from '$lib/supabase/habits';
	import { getCheckinsSince, getRelapsesSince } from '$lib/supabase/reports';
	import { supabase } from '$lib/supabase/client';

	let habit = null;
	let loading = true;
	let errorMsg = '';
	let periyot = 7; // 7 = haftalık, 30 = aylık
	let checkins = [];
	let relapses = [];
	let aiÖzet = '';
	let aiYükleniyor = false;
	let aiHata = '';
	let kullanıcıAdı = '';
	let pdfOluşturuluyor = false;

	const moodRenkleri = { 1: '#b5482f', 2: '#c97a52', 3: '#c69a3a', 4: '#7fbfa8', 5: '#2f6f5e' };

	onMount(async () => {
		if (!$user) return;
		try {
			habit = await getActiveHabit($user.id);
			const { data: profil } = await supabase.from('profiles').select('kullanici_adi').eq('id', $user.id).single();
			kullanıcıAdı = profil?.kullanici_adi ?? '';
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
		await verileriYükle();
	});

	async function verileriYükle() {
		if (!habit) return;
		try {
			const sinceDate = new Date();
			sinceDate.setDate(sinceDate.getDate() - (periyot - 1));
			sinceDate.setHours(0, 0, 0, 0);

			[checkins, relapses] = await Promise.all([
				getCheckinsSince(habit.id, sinceDate.toISOString()),
				getRelapsesSince(habit.id, sinceDate.toISOString())
			]);
		} catch (e) {
			errorMsg = e.message;
		}
	}

	async function periyotDeğiştir(yeni) {
		periyot = yeni;
		aiÖzet = '';
		aiHata = '';
		await verileriYükle();
	}

	async function aiÖzetÇıkar() {
		aiYükleniyor = true;
		aiHata = '';
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			const res = await fetch('/api/rapor-ozeti', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session?.access_token}`
				},
				body: JSON.stringify({
					periyot,
					checkinOrani: checkinOranı,
					ortalamaMood,
					seriBozmaSayisi: relapses.length,
					tetikleyiciNotlari: tetikleyiciNotlar.map((c) => c.tetikleyici_notu),
					dil: $locale
				})
			});
			const veri = await res.json();
			if (veri.hata) {
				aiHata = veri.hata;
			} else {
				aiÖzet = veri.özet;
			}
		} catch (e) {
			aiHata = e.message;
		} finally {
			aiYükleniyor = false;
		}
	}

	async function pdfİndir() {
		pdfOluşturuluyor = true;
		try {
			const [{ default: pdfMake }, vfsModül] = await Promise.all([
				import('pdfmake/build/pdfmake'),
				import('pdfmake/build/vfs_fonts')
			]);
			pdfMake.vfs = vfsModül.pdfMake?.vfs ?? vfsModül.default?.pdfMake?.vfs;

			const dilEN = $locale === 'en';
			const periyotMetni = periyot === 7 ? $_('rapor.haftalik') : $_('rapor.aylik');
			const raporTarihi = new Date().toLocaleString(dilEN ? 'en-US' : 'tr-TR');
			const tarihAralığı = `${tarihFormatla(günler[0])} – ${tarihFormatla(günler[günler.length - 1])}`;

			const mtBaslik = dilEN ? 'Progress Report' : 'Gelişim Raporu';
			const mtKullanici = dilEN ? 'User' : 'Kullanıcı';
			const mtAliskanlik = dilEN ? 'Habit' : 'Alışkanlık';
			const mtPeriyot = dilEN ? 'Period' : 'Periyot';
			const mtRaporTarihi = dilEN ? 'Report Date' : 'Rapor Tarihi';
			const mtOzetIstatistik = dilEN ? 'Summary Statistics' : 'Özet İstatistikler';
			const mtCheckinOrani = dilEN ? 'Check-in Rate' : 'Check-in Oranı';
			const mtOrtalamaMood = dilEN ? 'Average Mood' : 'Ortalama Ruh Hali';
			const mtSeriBozma = dilEN ? 'Relapse Count' : 'Seri Bozma Sayısı';
			const mtGunlukGecmis = dilEN ? 'Daily Mood Log' : 'Günlük Ruh Hali Kaydı';
			const mtTarih = dilEN ? 'Date' : 'Tarih';
			const mtRuhHali = dilEN ? 'Mood' : 'Ruh Hali';
			const mtNot = dilEN ? 'Note' : 'Not';
			const mtCheckinYok = dilEN ? 'No check-in' : 'Check-in yok';
			const mtNuksGecmisi = dilEN ? 'Relapse History' : 'Seri Bozma (Nüks) Geçmişi';
			const mtNuksYok = dilEN
				? 'No relapses recorded in this period.'
				: 'Bu dönemde kayıtlı seri bozma yok.';
			const mtTetikleyiciler = dilEN ? 'Trigger Notes' : 'Tetikleyici Notları';
			const mtTetikleyiciYok = dilEN
				? 'No trigger notes entered in this period.'
				: 'Bu dönemde tetikleyici notu girilmemiş.';
			const mtAiOzet = dilEN ? 'AI-Assisted Summary' : 'Yapay Zeka Destekli Özet';
			const mtDisclaimer = dilEN
				? 'This report is automatically generated from the user\'s self-reported check-in data within the application. It does not constitute a medical diagnosis and should be evaluated by a qualified professional alongside other clinical information.'
				: 'Bu rapor, kullanıcının uygulama içinde kendi beyanına dayalı olarak girdiği check-in verilerinden otomatik olarak oluşturulmuştur. Tıbbi bir teşhis niteliği taşımaz; yetkili bir uzman tarafından diğer klinik bilgilerle birlikte değerlendirilmelidir.';

			const günSatırları = günler.map((gün) => {
				const checkin = checkinByGün.get(günAnahtarı(gün));
				return [
					tarihFormatla(gün),
					checkin ? $_(`dashboard.mood_${checkin.mood}`) : mtCheckinYok,
					checkin?.tetikleyici_notu || ''
				];
			});

			const içerik = [
				{ text: 'Ev Dön', style: 'brand' },
				{ text: mtBaslik, style: 'title' },
				{
					table: {
						widths: ['auto', '*'],
						body: [
							[{ text: mtKullanici + ':', bold: true, border: [false, false, false, false] }, kullanıcıAdı],
							[{ text: mtAliskanlik + ':', bold: true, border: [false, false, false, false] }, habit.alışkanlık_adı],
							[
								{ text: mtPeriyot + ':', bold: true, border: [false, false, false, false] },
								`${periyotMetni} (${tarihAralığı})`
							],
							[{ text: mtRaporTarihi + ':', bold: true, border: [false, false, false, false] }, raporTarihi]
						]
					},
					layout: 'noBorders',
					margin: [0, 10, 0, 16]
				},
				{ text: mtOzetIstatistik, style: 'sectionHeader' },
				{
					table: {
						widths: ['*', 'auto'],
						body: [
							[mtCheckinOrani, `%${checkinOranı} (${yapılanCheckinSayısı}/${günler.length})`],
							[mtOrtalamaMood, ortalamaMood ?? '—'],
							[mtSeriBozma, String(relapses.length)]
						]
					},
					margin: [0, 4, 0, 16]
				},
				{ text: mtGunlukGecmis, style: 'sectionHeader' },
				{
					table: {
						headerRows: 1,
						widths: ['auto', 'auto', '*'],
						body: [
							[
								{ text: mtTarih, style: 'tableHeader' },
								{ text: mtRuhHali, style: 'tableHeader' },
								{ text: mtNot, style: 'tableHeader' }
							],
							...günSatırları
						]
					},
					margin: [0, 4, 0, 16]
				},
				{ text: mtNuksGecmisi, style: 'sectionHeader' },
				relapses.length > 0
					? {
							table: {
								headerRows: 1,
								widths: ['auto', '*'],
								body: [
									[{ text: mtTarih, style: 'tableHeader' }, { text: mtNot, style: 'tableHeader' }],
									...relapses.map((r) => [tarihFormatla(r.tarih), r.not_ || ''])
								]
							},
							margin: [0, 4, 0, 16]
						}
					: { text: mtNuksYok, italics: true, color: '#888', margin: [0, 4, 0, 16] }
			];

			if (aiÖzet) {
				içerik.push({ text: mtAiOzet, style: 'sectionHeader' });
				içerik.push({ text: aiÖzet, margin: [0, 4, 0, 16], italics: true });
			}

			const docDefinition = {
				content: içerik,
				styles: {
					brand: { fontSize: 10, color: '#2f6f5e', bold: true, margin: [0, 0, 0, 4] },
					title: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
					sectionHeader: { fontSize: 12, bold: true, color: '#2f6f5e', margin: [0, 12, 0, 4] },
					tableHeader: { bold: true, fillColor: '#f6f3ee' }
				},
				defaultStyle: { fontSize: 9 },
				footer: (currentPage, pageCount) => ({
					stack: [
						{ text: mtDisclaimer, fontSize: 6.5, color: '#999', margin: [40, 4, 40, 0] },
						{ text: `${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 7, margin: [0, 2, 40, 0] }
					]
				})
			};

			pdfMake.createPdf(docDefinition).download(`gelisim-raporu-${periyot}gun.pdf`);
		} catch (e) {
			errorMsg = e.message;
		} finally {
			pdfOluşturuluyor = false;
		}
	}

	function günAnahtarı(tarih) {
		const d = new Date(tarih);
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}

	$: günler = (() => {
		const liste = [];
		for (let i = periyot - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			liste.push(d);
		}
		return liste;
	})();

	$: checkinByGün = (() => {
		const map = new Map();
		for (const c of checkins) {
			map.set(günAnahtarı(c.tarih), c); // aynı günde birden fazlaysa sonuncusu kalır
		}
		return map;
	})();

	$: yapılanCheckinSayısı = checkinByGün.size;
	$: checkinOranı = günler.length > 0 ? Math.round((yapılanCheckinSayısı / günler.length) * 100) : 0;

	$: ortalamaMood = (() => {
		const moodlar = [...checkinByGün.values()].map((c) => c.mood);
		if (moodlar.length === 0) return null;
		return (moodlar.reduce((a, b) => a + b, 0) / moodlar.length).toFixed(1);
	})();

	$: tetikleyiciNotlar = checkins
		.filter((c) => c.tetikleyici_notu && c.tetikleyici_notu.trim())
		.slice()
		.reverse();

	const moodEmoji = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

	function tarihFormatla(tarih) {
		return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
	}

	const BAR_W = 18;
	const CHART_H = 120;
	$: chartWidth = günler.length * BAR_W;
</script>

<svelte:head>
	<title>{$_('rapor.baslik')}</title>
</svelte:head>

<div class="rapor-header">
	<div class="rapor-header-top">
		<div>
			<h1 class="font-display">{$_('rapor.baslik')}</h1>
			<p class="muted">{$_('rapor.aciklama')}</p>
		</div>
		{#if habit}
			<button class="btn-pdf" on:click={pdfİndir} disabled={pdfOluşturuluyor}>
				{pdfOluşturuluyor ? $_('rapor.pdf_hazirlaniyor') : $_('rapor.pdf_indir')}
			</button>
		{/if}
	</div>
</div>

{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

{#if loading}
	<p class="muted">…</p>
{:else if !habit}
	<div class="card empty-state">
		<p>{$_('rapor.habit_yok')}</p>
		<a class="btn-primary" href="/dashboard">{$_('ev.habit_yok_link')}</a>
	</div>
{:else}
	<div class="periyot-toggle">
		<button class:active={periyot === 7} on:click={() => periyotDeğiştir(7)}>{$_('rapor.haftalik')}</button>
		<button class:active={periyot === 30} on:click={() => periyotDeğiştir(30)}>{$_('rapor.aylik')}</button>
	</div>

	<div class="stat-row">
		<div class="card stat">
			<span class="stat-label">{$_('rapor.checkin_orani')}</span>
			<span class="stat-value font-display">%{checkinOranı}</span>
			<span class="stat-alt">{yapılanCheckinSayısı}/{günler.length} {$_('dashboard.gun')}</span>
		</div>
		<div class="card stat">
			<span class="stat-label">{$_('rapor.ortalama_mood')}</span>
			<span class="stat-value font-display">{ortalamaMood ?? '—'}</span>
			{#if ortalamaMood}<span class="stat-alt">{moodEmoji[Math.round(ortalamaMood)]}</span>{/if}
		</div>
		<div class="card stat">
			<span class="stat-label">{$_('rapor.seri_bozma')}</span>
			<span class="stat-value font-display" class:warn-color={relapses.length > 0}>{relapses.length}</span>
		</div>
	</div>

	<div class="card chart-card">
		<h2 class="font-display">{$_('rapor.mood_grafigi')}</h2>
		<div class="chart-scroll">
			<svg width={chartWidth} height={CHART_H + 24} viewBox="0 0 {chartWidth} {CHART_H + 24}">
				{#each günler as gün, i}
					{@const anahtar = günAnahtarı(gün)}
					{@const checkin = checkinByGün.get(anahtar)}
					{@const barH = checkin ? (checkin.mood / 5) * CHART_H : 4}
					<rect
						x={i * BAR_W + 3}
						y={CHART_H - barH}
						width={BAR_W - 6}
						height={barH}
						rx="2"
						fill={checkin ? moodRenkleri[checkin.mood] : 'var(--border)'}
					>
						<title>{tarihFormatla(gün)} — {checkin ? $_(`dashboard.mood_${checkin.mood}`) : $_('rapor.checkin_yok')}</title>
					</rect>
					{#if periyot === 7}
						<text x={i * BAR_W + BAR_W / 2} y={CHART_H + 16} text-anchor="middle" font-size="9" fill="var(--text-muted)">
							{gün.getDate()}
						</text>
					{/if}
				{/each}
			</svg>
		</div>
	</div>

	<div class="card ai-card">
		<div class="ai-header">
			<h2 class="font-display">{$_('rapor.ai_ozet_baslik')}</h2>
			<button class="btn-ai" on:click={aiÖzetÇıkar} disabled={aiYükleniyor}>
				{aiYükleniyor ? $_('rapor.ai_yukleniyor') : $_('rapor.ai_ozet_cikar')}
			</button>
		</div>
		{#if aiHata}
			<p class="error">{aiHata}</p>
		{:else if aiÖzet}
			<p class="ai-metin">{aiÖzet}</p>
		{:else}
			<p class="muted small">{$_('rapor.ai_ozet_aciklama')}</p>
		{/if}
	</div>

	{#if relapses.length > 0}
		<div class="card">
			<h2 class="font-display">{$_('rapor.nuks_gecmisi')}</h2>
			<div class="log-list">
				{#each relapses as r (r.id)}
					<div class="log-item">
						<span class="log-tarih">{tarihFormatla(r.tarih)}</span>
						{#if r.not_}<span class="log-not">{r.not_}</span>{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if tetikleyiciNotlar.length > 0}
		<div class="card">
			<h2 class="font-display">{$_('rapor.tetikleyici_notlari')}</h2>
			<div class="log-list">
				{#each tetikleyiciNotlar as c (c.id)}
					<div class="log-item">
						<span class="log-tarih">{tarihFormatla(c.tarih)} · {moodEmoji[c.mood]}</span>
						<span class="log-not">{c.tetikleyici_notu}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/if}

<style>
	.rapor-header {
		margin-bottom: 20px;
	}
	.rapor-header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.btn-pdf {
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--accent);
		border-radius: 10px;
		padding: 10px 18px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-pdf:hover {
		border-color: var(--accent);
	}
	.btn-pdf:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.rapor-header h1 {
		font-size: 1.6rem;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.muted {
		color: var(--text-muted);
		font-size: 0.92rem;
	}
	.muted.small {
		font-size: 0.82rem;
	}
	.error {
		color: var(--warn);
		font-size: 0.85rem;
	}

	.card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 22px;
		margin-bottom: 20px;
	}
	.empty-state {
		max-width: 420px;
		margin: 60px auto;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.btn-primary {
		background: var(--accent);
		color: var(--bg-elevated);
		border: none;
		border-radius: 10px;
		padding: 12px 20px;
		font-weight: 600;
		text-decoration: none;
		display: inline-block;
	}

	.periyot-toggle {
		display: inline-flex;
		border: 1px solid var(--border);
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 20px;
	}
	.periyot-toggle button {
		border: none;
		background: var(--bg-elevated);
		color: var(--text-muted);
		font-weight: 600;
		font-size: 0.85rem;
		padding: 9px 20px;
		cursor: pointer;
	}
	.periyot-toggle button.active {
		background: var(--accent);
		color: var(--bg-elevated);
	}

	.stat-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 0;
	}
	.stat-label {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.stat-value {
		font-size: 1.6rem;
		font-weight: 500;
	}
	.stat-value.warn-color {
		color: var(--warn);
	}
	.stat-alt {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.chart-card h2,
	.card h2 {
		font-size: 1.05rem;
		font-weight: 500;
		margin: 0 0 16px;
	}
	.chart-scroll {
		overflow-x: auto;
	}

	.ai-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}
	.ai-header h2 {
		margin: 0;
	}
	.btn-ai {
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-ai:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.ai-metin {
		font-size: 0.92rem;
		line-height: 1.6;
		color: var(--text);
		margin: 0;
	}

	.log-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.log-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--border);
		font-size: 0.85rem;
	}
	.log-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.log-tarih {
		font-weight: 600;
		color: var(--text-muted);
		font-size: 0.78rem;
	}
	.log-not {
		color: var(--text);
	}
</style>
