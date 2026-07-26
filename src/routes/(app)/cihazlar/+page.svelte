<script>
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import {
		getCihazlar,
		cihazEkle,
		cihazGüncelle,
		cihazSil,
		cihazÇevrimİçiMi,
		cihazKalanSaniye,
		cihazSureEkle
	} from '$lib/supabase/devices';

	const kategoriler = ['Oyun Konsolu', 'Bilgisayar', 'Akıllı TV', 'Modem', 'Diğer'];
	const kategoriIkon = {
		'Oyun Konsolu': '/cihazlar/oyun-konsolu.svg',
		Bilgisayar: '/cihazlar/bilgisayar.svg',
		'Akıllı TV': '/cihazlar/akilli-tv.svg',
		Modem: '/cihazlar/modem.svg'
	};
	const kategoriI18nAnahtarı = {
		'Oyun Konsolu': 'cihazlar.kategori_oyun_konsolu',
		Bilgisayar: 'cihazlar.kategori_bilgisayar',
		'Akıllı TV': 'cihazlar.kategori_akilli_tv',
		Modem: 'cihazlar.kategori_modem',
		Diğer: 'cihazlar.kategori_diger'
	};

	let cihazlar = [];
	let loading = true;
	let errorMsg = '';
	let yeniCihazAdı = '';
	let yeniKategori = 'Oyun Konsolu';
	let yeniLimit = '60';
	let ekleniyor = false;
	let kopyalananId = null;
	let süreEkleniyorId = null;
	let şimdi = Date.now();
	let interval;

	onMount(async () => {
		interval = setInterval(() => (şimdi = Date.now()), 1000);
		if (!$user) return;
		try {
			cihazlar = await getCihazlar($user.id);
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	// her saniye (şimdi değiştikçe) tüm cihazların kalan süresini yeniden hesapla
	$: kalanSüreMap = (() => {
		void şimdi;
		const harita = new Map();
		for (const c of cihazlar) harita.set(c.id, cihazKalanSaniye(c));
		return harita;
	})();

	function süreFormatla(saniye) {
		const dk = Math.floor(saniye / 60);
		const sn = saniye % 60;
		return `${dk}:${String(sn).padStart(2, '0')}`;
	}

	async function ekle() {
		if (!yeniCihazAdı.trim() || ekleniyor) return;
		ekleniyor = true;
		errorMsg = '';
		try {
			const yeni = await cihazEkle($user.id, {
				cihaz_adı: yeniCihazAdı.trim(),
				kategori: yeniKategori,
				limit_dakika: yeniLimit ? parseInt(yeniLimit, 10) : 60
			});
			cihazlar = [...cihazlar, yeni];
			yeniCihazAdı = '';
		} catch (e) {
			errorMsg = e.message;
		} finally {
			ekleniyor = false;
		}
	}

	async function fişiDeğiştir(cihaz) {
		try {
			const güncel = await cihazGüncelle(cihaz.id, {
				fiş_kapali: !cihaz.fiş_kapali,
				...(cihaz.fiş_kapali ? { baslangic_zamani: new Date().toISOString() } : {})
			});
			cihazlar = cihazlar.map((c) => (c.id === güncel.id ? güncel : c));
		} catch (e) {
			errorMsg = e.message;
		}
	}

	async function süreEkle(cihaz) {
		süreEkleniyorId = cihaz.id;
		errorMsg = '';
		try {
			const güncel = await cihazSureEkle(cihaz.id, $user.id, 15);
			cihazlar = cihazlar.map((c) => (c.id === güncel.id ? güncel : c));
		} catch (e) {
			errorMsg = e.message.includes('coin') ? $_('cihazlar.sure_yetersiz_coin') : e.message;
		} finally {
			süreEkleniyorId = null;
		}
	}

	async function otomatikKesDeğiştir(cihaz) {
		try {
			const güncel = await cihazGüncelle(cihaz.id, { nukste_otomatik_kes: !cihaz.nukste_otomatik_kes });
			cihazlar = cihazlar.map((c) => (c.id === güncel.id ? güncel : c));
		} catch (e) {
			errorMsg = e.message;
		}
	}

	async function sil(cihaz) {
		try {
			await cihazSil(cihaz.id);
			cihazlar = cihazlar.filter((c) => c.id !== cihaz.id);
		} catch (e) {
			errorMsg = e.message;
		}
	}

	async function koduKopyala(cihaz) {
		try {
			await navigator.clipboard.writeText(cihaz.cihaz_kodu);
			kopyalananId = cihaz.id;
			setTimeout(() => (kopyalananId = null), 2000);
		} catch {
			// pano erişimi engellenmişse sessizce geç
		}
	}
</script>

<svelte:head>
	<title>{$_('cihazlar.baslik')}</title>
</svelte:head>

<div class="cihazlar-header">
	<h1 class="font-display">{$_('cihazlar.baslik')}</h1>
	<p class="muted">{$_('cihazlar.aciklama')}</p>
</div>

{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

{#if loading}
	<p class="muted">…</p>
{:else}
	<div class="card ekle-card">
		<h2 class="font-display">{$_('cihazlar.yeni_cihaz')}</h2>
		<form on:submit|preventDefault={ekle}>
			<div class="form-row">
				<label>
					{$_('cihazlar.cihaz_adi')}
					<input type="text" bind:value={yeniCihazAdı} placeholder={$_('cihazlar.cihaz_adi_placeholder')} />
				</label>
				<label>
					{$_('cihazlar.kategori')}
					<select bind:value={yeniKategori}>
						{#each kategoriler as kategori}
							<option value={kategori}>{$_(kategoriI18nAnahtarı[kategori])}</option>
						{/each}
					</select>
				</label>
				<label class="limit-alani">
					{$_('cihazlar.gunluk_limit')}
					<input type="number" min="1" step="1" bind:value={yeniLimit} />
				</label>
			</div>
			<button class="btn-primary" type="submit" disabled={!yeniCihazAdı.trim() || ekleniyor}>
				{$_('cihazlar.ekle')}
			</button>
		</form>
	</div>

	{#if cihazlar.length === 0}
		<p class="muted" style="margin-top:20px">{$_('cihazlar.cihaz_yok')}</p>
	{:else}
		<div class="cihaz-list">
			{#each cihazlar as cihaz (cihaz.id)}
				{@const çevrimİçi = cihazÇevrimİçiMi(cihaz)}
				{@const kalan = kalanSüreMap.get(cihaz.id) ?? 0}
				<div class="card cihaz-card">
					<div class="cihaz-top">
						<div class="cihaz-kimlik">
							{#if kategoriIkon[cihaz.kategori]}
								<img class="cihaz-ikon" src={kategoriIkon[cihaz.kategori]} alt="" />
							{:else}
								<span class="cihaz-ikon-yedek">{cihaz.cihaz_adı.slice(0, 1).toUpperCase()}</span>
							{/if}
							<div class="cihaz-isim-satiri">
								<span class="cihaz-adi font-display">{cihaz.cihaz_adı}</span>
								<span class="cihaz-kategori muted small">
									{$_(kategoriI18nAnahtarı[cihaz.kategori] ?? 'cihazlar.kategori_diger')}
								</span>
							</div>
						</div>
						<span class="durum-badge" class:online={çevrimİçi}>
							<span class="durum-nokta"></span>
							{çevrimİçi ? $_('cihazlar.cevrimici') : $_('cihazlar.cevrimdisi')}
						</span>
					</div>

					<div class="sure-alani">
						<span class="sure-label">{$_('cihazlar.kalan_sure')}</span>
						<span class="sure-deger font-display" class:doldu={kalan <= 0 && !cihaz.fiş_kapali}>
							{cihaz.fiş_kapali ? $_('cihazlar.sure_doldu') : süreFormatla(kalan)}
						</span>
						<button class="btn-sure-ekle" on:click={() => süreEkle(cihaz)} disabled={süreEkleniyorId === cihaz.id}>
							{$_('cihazlar.sure_ekle')}
						</button>
					</div>

					<div class="kod-satiri">
						<span class="kod-label">{$_('cihazlar.cihaz_kodu')}</span>
						<code class="kod-deger">{cihaz.cihaz_kodu}</code>
						<button class="kod-kopyala" on:click={() => koduKopyala(cihaz)}>
							{kopyalananId === cihaz.id ? $_('cihazlar.kopyalandi') : $_('cihazlar.kopyala')}
						</button>
					</div>
					<p class="kod-aciklama">{$_('cihazlar.kod_aciklama')}</p>

					<label class="oto-kes-satiri">
						<input type="checkbox" checked={cihaz.nukste_otomatik_kes} on:change={() => otomatikKesDeğiştir(cihaz)} />
						{$_('cihazlar.nukste_otomatik')}
					</label>

					<div class="cihaz-actions">
						<button class="btn-fis" class:kesik={cihaz.fiş_kapali} on:click={() => fişiDeğiştir(cihaz)}>
							{cihaz.fiş_kapali ? $_('cihazlar.fisi_ac') : $_('cihazlar.fisi_kes')}
						</button>
						<button class="btn-sil" on:click={() => sil(cihaz)}>{$_('cihazlar.sil')}</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<p class="firmware-notu">💡 {$_('cihazlar.firmware_bilgi')}</p>
{/if}

<style>
	.cihazlar-header {
		margin-bottom: 24px;
	}
	.cihazlar-header h1 {
		font-size: 1.6rem;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.muted {
		color: var(--text-muted);
		font-size: 0.92rem;
	}
	.muted.small {
		font-size: 0.75rem;
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
	}
	.ekle-card h2 {
		font-size: 1.05rem;
		font-weight: 500;
		margin: 0 0 14px;
	}
	.ekle-card form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.form-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.form-row label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.78rem;
		color: var(--text-muted);
		font-weight: 600;
		flex: 1;
		min-width: 140px;
	}
	.limit-alani {
		max-width: 160px;
	}
	.ekle-card input,
	.ekle-card select {
		font-family: inherit;
		font-size: 0.9rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
	}
	.btn-primary {
		align-self: flex-start;
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 8px;
		padding: 10px 18px;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.cihaz-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-top: 20px;
	}
	.cihaz-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.cihaz-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cihaz-kimlik {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.cihaz-ikon {
		width: 34px;
		height: 34px;
	}
	.cihaz-ikon-yedek {
		width: 34px;
		height: 34px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		flex-shrink: 0;
	}
	.cihaz-isim-satiri {
		display: flex;
		flex-direction: column;
	}
	.cihaz-adi {
		font-size: 1.05rem;
		font-weight: 500;
	}
	.durum-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.durum-nokta {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--text-muted);
	}
	.durum-badge.online {
		color: var(--accent);
	}
	.durum-badge.online .durum-nokta {
		background: var(--accent);
	}

	.sure-alani {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--bg);
		border-radius: 10px;
		padding: 10px 14px;
		flex-wrap: wrap;
	}
	.sure-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.sure-deger {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--accent);
	}
	.sure-deger.doldu {
		color: var(--warn);
	}
	.btn-sure-ekle {
		margin-left: auto;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--accent);
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-sure-ekle:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.kod-satiri {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.kod-label {
		font-size: 0.78rem;
		color: var(--text-muted);
	}
	.kod-deger {
		font-family: monospace;
		font-size: 0.82rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 8px;
	}
	.kod-kopyala {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--accent);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.kod-aciklama {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin: 0;
	}

	.oto-kes-satiri {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text);
		cursor: pointer;
	}

	.cihaz-actions {
		display: flex;
		gap: 10px;
		margin-top: 4px;
	}
	.btn-fis {
		border: none;
		background: var(--warn);
		color: white;
		border-radius: 8px;
		padding: 9px 16px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.btn-fis.kesik {
		background: var(--accent);
	}
	.btn-sil {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		border-radius: 8px;
		padding: 9px 16px;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.btn-sil:hover {
		border-color: var(--warn);
		color: var(--warn);
	}

	.firmware-notu {
		margin-top: 24px;
		font-size: 0.85rem;
		color: var(--text-muted);
		background: var(--accent-soft);
		border-radius: 10px;
		padding: 12px 16px;
	}
</style>
