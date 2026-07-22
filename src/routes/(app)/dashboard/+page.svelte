<script>
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getActiveHabit, createHabit, recordRelapse, parsePgIntervalToSeconds } from '$lib/supabase/habits';
	import { getTodayCheckin, addCheckin } from '$lib/supabase/checkins';
	import { getDavetProfil, getBonusBakiye, anasayfaBonusuVerVarsaGerek, ANASAYFA_BONUS } from '$lib/supabase/coins';
	import { nükstePrizleriKapat } from '$lib/supabase/devices';
	import { getBasarimlar, getKullanıcıBasarımları, eksikRozetleriVer } from '$lib/supabase/achievements';
	import RozetSatiri from '$components/rozet/RozetSatiri.svelte';

	let habit = null;
	let loadingHabit = true;
	let errorMsg = '';

	let davetKodu = '';
	let bonusBakiye = 0;
	let davetLinkKopyalandı = false;

	// günün motivasyon cümlesi
	let motivasyonMesajı = '';
	let motivasyonYükleniyor = false;

	// onboarding formu
	let yeniAlışkanlıkAdı = '';
	let yeniBaşlangıç = new Date().toISOString().slice(0, 16); // datetime-local formatı
	let yeniTasarruf = '';
	let kaydediliyor = false;

	// canlı sayaç
	let şimdi = new Date();
	let interval;

	// nüks modalı
	let nüksModalAçık = false;
	let nüksNotu = '';
	let nüksKaydediliyor = false;

	// rozetler
	let rozetKataloglar = [];
	let kazanılmışRozetIdler = new Set();
	let yeniKazanılanRozetler = [];

	// check-in
	let bugünCheckin = null;
	let seçiliMood = null;
	let tetikleyiciNotu = '';
	let checkinKaydediliyor = false;

	const GÜNLÜK_COIN = 10;

	onMount(async () => {
		interval = setInterval(() => (şimdi = new Date()), 1000);
		if ($user) {
			try {
				habit = await getActiveHabit($user.id);
				if (habit) {
					bugünCheckin = await getTodayCheckin(habit.id);

					const şimdikiGün = Math.max(
						0,
						Math.floor((Date.now() - new Date(habit.başlangıç_tarihi).getTime()) / 86400000)
					);
					rozetKataloglar = await getBasarimlar();
					yeniKazanılanRozetler = await eksikRozetleriVer($user.id, şimdikiGün);
					const kazanılmışlar = await getKullanıcıBasarımları($user.id);
					kazanılmışRozetIdler = new Set(kazanılmışlar.map((k) => k.achievement_id));

					if (yeniKazanılanRozetler.length > 0) {
						setTimeout(() => (yeniKazanılanRozetler = []), 6000);
					}

					motivasyonMesajınıGetir(habit, şimdikiGün, bugünCheckin?.mood);
				}
				const profil = await getDavetProfil($user.id);
				davetKodu = profil.davet_kodu;
				bonusBakiye = await getBonusBakiye($user.id);

				const anaEkrandaAçıldı =
					window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
				if (anaEkrandaAçıldı) {
					const verildi = await anasayfaBonusuVerVarsaGerek($user.id);
					if (verildi) bonusBakiye += ANASAYFA_BONUS;
				}
			} catch (e) {
				errorMsg = e.message;
			}
		}
		loadingHabit = false;
	});

	async function motivasyonMesajınıGetir(habit, günSayısı, sonMood) {
		const bugünAnahtarı = new Date().toISOString().slice(0, 10);
		const cacheAnahtarı = `motivasyon-${habit.id}-${bugünAnahtarı}`;
		const önbellek = localStorage.getItem(cacheAnahtarı);
		if (önbellek) {
			motivasyonMesajı = önbellek;
			return;
		}

		motivasyonYükleniyor = true;
		try {
			const res = await fetch('/api/motivasyon', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ günSayısı, sonMood, alışkanlıkAdı: habit.alışkanlık_adı })
			});
			const veri = await res.json();
			if (veri.mesaj) {
				motivasyonMesajı = veri.mesaj;
				if (!veri.yerelFallback) localStorage.setItem(cacheAnahtarı, veri.mesaj);
			}
		} catch {
			// motivasyon mesajı olmazsa sessizce geç, kritik değil
		} finally {
			motivasyonYükleniyor = false;
		}
	}

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	async function habitOluştur() {
		if (!yeniAlışkanlıkAdı.trim()) return;
		kaydediliyor = true;
		errorMsg = '';
		try {
			habit = await createHabit($user.id, {
				alışkanlık_adı: yeniAlışkanlıkAdı.trim(),
				başlangıç_tarihi: new Date(yeniBaşlangıç).toISOString(),
				günlük_tasarruf_miktarı: yeniTasarruf ? parseFloat(yeniTasarruf) : 0
			});
		} catch (e) {
			errorMsg = e.message;
		} finally {
			kaydediliyor = false;
		}
	}

	async function nüksOnayla() {
		nüksKaydediliyor = true;
		errorMsg = '';
		try {
			habit = await recordRelapse(habit, nüksNotu.trim());
			nüksModalAçık = false;
			nüksNotu = '';
			bugünCheckin = null;
			await nükstePrizleriKapat($user.id);
		} catch (e) {
			errorMsg = e.message;
		} finally {
			nüksKaydediliyor = false;
		}
	}

	async function checkinGönder() {
		if (!seçiliMood) return;
		checkinKaydediliyor = true;
		errorMsg = '';
		try {
			bugünCheckin = await addCheckin(habit.id, seçiliMood, tetikleyiciNotu.trim());
		} catch (e) {
			errorMsg = e.message;
		} finally {
			checkinKaydediliyor = false;
		}
	}

	// geçen süreyi gün/saat/dk/sn olarak hesapla
	$: geçenSaniye = habit ? Math.max(0, Math.floor((şimdi.getTime() - new Date(habit.başlangıç_tarihi).getTime()) / 1000)) : 0;
	$: gün = Math.floor(geçenSaniye / 86400);
	$: saat = Math.floor((geçenSaniye % 86400) / 3600);
	$: dakika = Math.floor((geçenSaniye % 3600) / 60);
	$: saniye = geçenSaniye % 60;

	$: enUzunSaniye = habit ? Math.max(parsePgIntervalToSeconds(habit.en_uzun_seri), geçenSaniye) : 0;
	$: enUzunGün = Math.floor(enUzunSaniye / 86400);

	$: kazanılanCoin = gün * GÜNLÜK_COIN;
	$: birikenTasarruf = habit ? (gün * (habit.günlük_tasarruf_miktarı ?? 0)).toFixed(2) : '0.00';

	const moodEmoji = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

	let origin = '';
	onMount(() => {
		origin = window.location.origin;
	});

	$: davetLinki = davetKodu && origin ? `${origin}/kayit?ref=${davetKodu}` : '';

	async function davetLinkiniKopyala() {
		if (!davetLinki) return;
		try {
			await navigator.clipboard.writeText(davetLinki);
			davetLinkKopyalandı = true;
			setTimeout(() => (davetLinkKopyalandı = false), 2000);
		} catch {
			// pano erişimi engellenmişse sessizce geç
		}
	}
</script>

<svelte:head>
	<title>{$_('nav.dashboard')}</title>
</svelte:head>

{#if loadingHabit}
	<p class="muted">…</p>
{:else if !habit}
	<div class="card onboarding">
		<h1 class="font-display">{$_('dashboard.onboarding_baslik')}</h1>
		<p class="muted">{$_('dashboard.onboarding_aciklama')}</p>

		<form on:submit|preventDefault={habitOluştur}>
			<label>
				{$_('dashboard.alışkanlık_adı')}
				<input
					type="text"
					bind:value={yeniAlışkanlıkAdı}
					placeholder={$_('dashboard.alışkanlık_adı_placeholder')}
					required
				/>
			</label>
			<label>
				{$_('dashboard.başlangıç_tarihi')}
				<input type="datetime-local" bind:value={yeniBaşlangıç} required />
			</label>
			<label>
				{$_('dashboard.günlük_tasarruf')}
				<input type="number" min="0" step="0.01" bind:value={yeniTasarruf} placeholder="0" />
			</label>

			{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

			<button class="btn-primary" type="submit" disabled={kaydediliyor}>
				{$_('dashboard.kaydet_basla')}
			</button>
		</form>
	</div>
{:else}
	<div class="dashboard-grid">
		<section class="card counter-card">
			<span class="habit-name">{habit.alışkanlık_adı}</span>
			<div class="counter">
				<div class="counter-unit">
					<span class="counter-number font-display">{gün}</span>
					<span class="counter-label">{$_('dashboard.gun')}</span>
				</div>
				<div class="counter-unit">
					<span class="counter-number font-display">{String(saat).padStart(2, '0')}</span>
					<span class="counter-label">{$_('dashboard.saat')}</span>
				</div>
				<div class="counter-unit">
					<span class="counter-number font-display">{String(dakika).padStart(2, '0')}</span>
					<span class="counter-label">{$_('dashboard.dakika')}</span>
				</div>
				<div class="counter-unit">
					<span class="counter-number font-display">{String(saniye).padStart(2, '0')}</span>
					<span class="counter-label">{$_('dashboard.saniye')}</span>
				</div>
			</div>

			<button class="btn-relapse" on:click={() => (nüksModalAçık = true)}>
				{$_('dashboard.nuks_buton')}
			</button>
		</section>

		{#if motivasyonMesajı}
			<div class="motivasyon-satiri">{motivasyonMesajı}</div>
		{/if}

		<div class="stat-row">
			<div class="card stat">
				<span class="stat-label">{$_('dashboard.en_uzun_seri')}</span>
				<span class="stat-value font-display">{enUzunGün} {$_('dashboard.gun')}</span>
			</div>
			<div class="card stat">
				<span class="stat-label">{$_('dashboard.kazanilan_coin')}</span>
				<span class="stat-value font-display gold">🪙 {kazanılanCoin + bonusBakiye}</span>
			</div>
			{#if habit.günlük_tasarruf_miktarı > 0}
				<div class="card stat">
					<span class="stat-label">{$_('dashboard.tasarruf')}</span>
					<span class="stat-value font-display">₺{birikenTasarruf}</span>
				</div>
			{/if}
		</div>

		<section class="card checkin-card">
			<h2 class="font-display">{$_('dashboard.checkin_baslik')}</h2>

			{#if bugünCheckin}
				<p class="muted">{moodEmoji[bugünCheckin.mood]} {$_('dashboard.checkin_yapildi')}</p>
			{:else}
				<div class="mood-row">
					{#each [1, 2, 3, 4, 5] as m}
						<button
							class="mood-btn"
							class:selected={seçiliMood === m}
							on:click={() => (seçiliMood = m)}
							title={$_(`dashboard.mood_${m}`)}
						>
							{moodEmoji[m]}
						</button>
					{/each}
				</div>
				<textarea
					bind:value={tetikleyiciNotu}
					placeholder={$_('dashboard.checkin_tetikleyici')}
					rows="3"
				></textarea>
				<button class="btn-primary" on:click={checkinGönder} disabled={!seçiliMood || checkinKaydediliyor}>
					{$_('dashboard.checkin_kaydet')}
				</button>
			{/if}
		</section>

		<section class="card rozet-card">
			<h2 class="font-display">{$_('dashboard.rozetlerim')}</h2>
			<RozetSatiri kataloglar={rozetKataloglar} kazanılmışIdler={kazanılmışRozetIdler} />
		</section>

		<section class="card davet-card">
			<h2 class="font-display">{$_('dashboard.davet_baslik')}</h2>
			<p class="muted">{$_('dashboard.davet_aciklama', { values: { bonus: 50 } })}</p>
			<div class="davet-link-row">
				<input type="text" readonly value={davetLinki} on:click={(e) => e.target.select()} />
				<button class="btn-primary" on:click={davetLinkiniKopyala}>
					{davetLinkKopyalandı ? $_('dashboard.davet_kopyalandi') : $_('dashboard.davet_kopyala')}
				</button>
			</div>
		</section>
	</div>

	{#if yeniKazanılanRozetler.length > 0}
		<div class="rozet-toast">
			🎉 {$_('dashboard.yeni_rozet')}: {yeniKazanılanRozetler.map((r) => r.ad).join(', ')}
		</div>
	{/if}

	{#if nüksModalAçık}
		<div class="modal-backdrop" on:click|self={() => (nüksModalAçık = false)}>
			<div class="modal">
				<h3 class="font-display">{$_('dashboard.nuks_baslik')}</h3>
				<p class="muted">{$_('dashboard.nuks_aciklama')}</p>
				<textarea bind:value={nüksNotu} placeholder={$_('dashboard.nuks_not')} rows="3"></textarea>
				{#if errorMsg}<p class="error">{errorMsg}</p>{/if}
				<div class="modal-actions">
					<button class="btn-ghost" on:click={() => (nüksModalAçık = false)}>{$_('dashboard.vazgec')}</button>
					<button class="btn-warn" on:click={nüksOnayla} disabled={nüksKaydediliyor}>
						{$_('dashboard.nuks_onayla')}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 28px;
	}
	.muted {
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.5;
	}
	.error {
		color: var(--warn);
		font-size: 0.85rem;
	}

	.onboarding {
		max-width: 480px;
		margin: 40px auto;
	}
	.onboarding h1 {
		margin: 0 0 8px;
		font-size: 1.6rem;
		font-weight: 500;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 24px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	input,
	textarea {
		font-family: inherit;
		font-size: 0.95rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
	}
	input:focus,
	textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.btn-primary,
	.btn-ghost,
	.btn-warn,
	.btn-relapse {
		border-radius: 10px;
		padding: 12px 20px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.btn-primary {
		background: var(--accent);
		color: var(--bg-elevated);
		border: none;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.btn-ghost {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text);
	}
	.btn-warn {
		background: var(--warn);
		color: white;
		border: none;
	}
	.btn-relapse {
		background: transparent;
		border: 1px solid var(--warn);
		color: var(--warn);
		align-self: center;
		margin-top: 20px;
	}
	.btn-relapse:hover {
		background: var(--warn);
		color: white;
	}

	.dashboard-grid {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.motivasyon-satiri {
		background: var(--accent-soft);
		color: var(--accent);
		border-radius: 12px;
		padding: 14px 20px;
		font-size: 0.92rem;
		font-weight: 500;
		text-align: center;
		font-style: italic;
	}

	.counter-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.habit-name {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		font-weight: 600;
		margin-bottom: 16px;
	}
	.counter {
		display: flex;
		gap: 28px;
	}
	.counter-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.counter-number {
		font-size: clamp(2.2rem, 5vw, 3.2rem);
		font-weight: 500;
		color: var(--accent);
		line-height: 1;
	}
	.counter-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 6px;
	}

	.stat-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 16px;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 20px 22px;
	}
	.stat-label {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.stat-value {
		font-size: 1.5rem;
		font-weight: 500;
	}
	.stat-value.gold {
		color: var(--gold);
	}

	.checkin-card h2 {
		font-size: 1.2rem;
		font-weight: 500;
		margin: 0 0 16px;
	}
	.mood-row {
		display: flex;
		gap: 10px;
		margin-bottom: 14px;
	}
	.mood-btn {
		font-size: 1.4rem;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		border: 1px solid var(--border);
		background: var(--bg);
		cursor: pointer;
	}
	.mood-btn.selected {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.checkin-card textarea {
		width: 100%;
		margin-bottom: 14px;
		resize: vertical;
	}

	.davet-card h2 {
		font-size: 1.2rem;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.davet-card .muted {
		margin: 0 0 16px;
	}
	.davet-link-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.davet-link-row input {
		flex: 1;
		min-width: 0;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text-muted);
		text-overflow: ellipsis;
	}
	.davet-link-row .btn-primary {
		white-space: nowrap;
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.davet-link-row {
			flex-direction: column;
		}
		.davet-link-row input {
			width: 100%;
		}
		.davet-link-row .btn-primary {
			width: 100%;
		}
	}

	.rozet-card h2 {
		font-size: 1.2rem;
		font-weight: 500;
		margin: 0 0 16px;
	}

	.rozet-toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent);
		color: var(--bg-elevated);
		padding: 14px 24px;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
		z-index: 60;
		max-width: 90vw;
		text-align: center;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		z-index: 50;
	}
	.modal {
		background: var(--bg-elevated);
		border-radius: 16px;
		padding: 28px;
		max-width: 420px;
		width: 100%;
	}
	.modal h3 {
		margin: 0 0 8px;
		font-size: 1.2rem;
	}
	.modal textarea {
		width: 100%;
		margin: 14px 0;
		resize: vertical;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
