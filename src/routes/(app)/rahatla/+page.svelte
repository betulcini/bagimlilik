<script>
	import { onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { seansKaydet } from '$lib/supabase/nefes';

	const teknikler = [
		{
			id: '478',
			adKey: 'rahatla.teknik_478_ad',
			aciklamaKey: 'rahatla.teknik_478_aciklama',
			fazlar: [
				{ etiket: 'nefes_al', süre: 4, hedefÖlçek: 1.4 },
				{ etiket: 'tut', süre: 7, hedefÖlçek: 1.4 },
				{ etiket: 'nefes_ver', süre: 8, hedefÖlçek: 1.0 }
			]
		},
		{
			id: 'kutu',
			adKey: 'rahatla.teknik_kutu_ad',
			aciklamaKey: 'rahatla.teknik_kutu_aciklama',
			fazlar: [
				{ etiket: 'nefes_al', süre: 4, hedefÖlçek: 1.4 },
				{ etiket: 'tut', süre: 4, hedefÖlçek: 1.4 },
				{ etiket: 'nefes_ver', süre: 4, hedefÖlçek: 1.0 },
				{ etiket: 'tut', süre: 4, hedefÖlçek: 1.0 }
			]
		},
		{
			id: 'sakin',
			adKey: 'rahatla.teknik_sakin_ad',
			aciklamaKey: 'rahatla.teknik_sakin_aciklama',
			fazlar: [
				{ etiket: 'nefes_al', süre: 4, hedefÖlçek: 1.4 },
				{ etiket: 'nefes_ver', süre: 6, hedefÖlçek: 1.0 }
			]
		}
	];

	let seçiliTeknik = null;
	let fazIndex = 0;
	let kalanSaniye = 0;
	let çalışıyorMu = false;
	let tamamlananTur = 0;
	let geçenSaniye = 0;
	let interval;

	function teknikSeç(teknik) {
		seçiliTeknik = teknik;
		sıfırla();
	}

	function geriDön() {
		seansıKaydetVeDurdur();
		seçiliTeknik = null;
	}

	function başlat() {
		if (!seçiliTeknik || çalışıyorMu) return;
		çalışıyorMu = true;
		kalanSaniye = seçiliTeknik.fazlar[fazIndex].süre;
		interval = setInterval(tik, 1000);
	}

	function durdur() {
		seansıKaydetVeDurdur();
	}

	function seansıKaydetVeDurdur() {
		çalışıyorMu = false;
		if (interval) clearInterval(interval);

		if (geçenSaniye > 0 && $user && seçiliTeknik) {
			seansKaydet($user.id, seçiliTeknik.id, tamamlananTur, geçenSaniye).catch(() => {
				// seans kaydı başarısız olsa bile kritik değil, egzersizin kendisi zaten yapıldı
			});
		}
		geçenSaniye = 0;
	}

	function sıfırla() {
		seansıKaydetVeDurdur();
		fazIndex = 0;
		tamamlananTur = 0;
		kalanSaniye = seçiliTeknik ? seçiliTeknik.fazlar[0].süre : 0;
	}

	function tik() {
		kalanSaniye -= 1;
		geçenSaniye += 1;
		if (kalanSaniye <= 0) {
			fazIndex += 1;
			if (fazIndex >= seçiliTeknik.fazlar.length) {
				fazIndex = 0;
				tamamlananTur += 1;
			}
			kalanSaniye = seçiliTeknik.fazlar[fazIndex].süre;
		}
	}

	onDestroy(() => {
		if (interval) clearInterval(interval);
		if (geçenSaniye > 0 && $user && seçiliTeknik) {
			seansKaydet($user.id, seçiliTeknik.id, tamamlananTur, geçenSaniye).catch(() => {});
		}
	});

	$: aktifFaz = seçiliTeknik ? seçiliTeknik.fazlar[fazIndex] : null;
</script>

<svelte:head>
	<title>{$_('rahatla.baslik')}</title>
</svelte:head>

<div class="rahatla-header">
	<h1 class="font-display">{$_('rahatla.baslik')}</h1>
	<p class="muted">{$_('rahatla.aciklama')}</p>
</div>

{#if !seçiliTeknik}
	<div class="teknik-grid">
		{#each teknikler as teknik (teknik.id)}
			<button class="teknik-card" on:click={() => teknikSeç(teknik)}>
				<h2 class="font-display">{$_(teknik.adKey)}</h2>
				<p class="muted small">{$_(teknik.aciklamaKey)}</p>
				<div class="faz-özet">
					{#each teknik.fazlar as f, i}
						<span>{f.süre}s</span>
						{#if i < teknik.fazlar.length - 1}<span class="ayrac">→</span>{/if}
					{/each}
				</div>
			</button>
		{/each}
	</div>
{:else}
	<button class="geri-btn" on:click={geriDön}>{$_('rahatla.geri')}</button>

	<div class="egzersiz-card">
		<h2 class="font-display">{$_(seçiliTeknik.adKey)}</h2>

		<div class="daire-alan">
			<div
				class="daire"
				style="transform: scale({aktifFaz.hedefÖlçek}); transition-duration: {çalışıyorMu ? aktifFaz.süre : 0.3}s;"
			>
				<span class="daire-etiket">{$_(`rahatla.${aktifFaz.etiket}`)}</span>
				<span class="daire-sayac">{çalışıyorMu ? kalanSaniye : aktifFaz.süre}</span>
			</div>
		</div>

		<p class="tur-bilgisi">{$_('rahatla.tur_sayisi')}: {tamamlananTur}</p>

		<div class="kontrol-satiri">
			{#if çalışıyorMu}
				<button class="btn-ghost" on:click={durdur}>{$_('rahatla.durdur')}</button>
			{:else}
				<button class="btn-primary" on:click={başlat}>{$_('rahatla.baslat')}</button>
			{/if}
			<button class="btn-ghost" on:click={sıfırla}>{$_('rahatla.sifirla')}</button>
		</div>
	</div>

	<p class="disclaimer">{$_('rahatla.disclaimer')}</p>
{/if}

<style>
	.rahatla-header {
		margin-bottom: 24px;
	}
	.rahatla-header h1 {
		font-size: 1.6rem;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.muted {
		color: var(--text-muted);
		font-size: 0.92rem;
	}
	.muted.small {
		font-size: 0.85rem;
	}

	.teknik-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}
	.teknik-card {
		text-align: left;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 22px;
		cursor: pointer;
		font-family: inherit;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.teknik-card:hover {
		border-color: var(--accent);
	}
	.teknik-card h2 {
		font-size: 1.1rem;
		font-weight: 500;
		margin: 0;
	}
	.faz-özet {
		margin-top: 8px;
		font-size: 0.8rem;
		color: var(--accent);
		font-weight: 600;
	}
	.ayrac {
		margin: 0 4px;
		color: var(--text-muted);
	}

	.geri-btn {
		border: none;
		background: transparent;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0 0 16px;
	}

	.egzersiz-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.egzersiz-card h2 {
		font-size: 1.2rem;
		font-weight: 500;
		margin: 0 0 24px;
	}

	.daire-alan {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 240px;
		width: 100%;
	}
	.daire {
		width: 120px;
		height: 120px;
		border-radius: 999px;
		background: radial-gradient(circle at 35% 30%, var(--accent), var(--accent) 60%, #2f6f5e 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--bg-elevated);
		transition-property: transform;
		transition-timing-function: linear;
		box-shadow: 0 0 40px 10px var(--accent-soft);
	}
	.daire-etiket {
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.daire-sayac {
		font-size: 1.6rem;
		font-weight: 700;
		font-family: 'Fraunces', Georgia, serif;
	}

	.tur-bilgisi {
		margin: 20px 0;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.kontrol-satiri {
		display: flex;
		gap: 12px;
	}
	.btn-primary {
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 10px;
		padding: 12px 28px;
		font-weight: 600;
		font-size: 0.92rem;
		cursor: pointer;
	}
	.btn-ghost {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text);
		border-radius: 10px;
		padding: 12px 22px;
		font-weight: 600;
		font-size: 0.92rem;
		cursor: pointer;
	}

	.disclaimer {
		margin-top: 20px;
		font-size: 0.78rem;
		color: var(--text-muted);
		text-align: center;
	}
</style>
