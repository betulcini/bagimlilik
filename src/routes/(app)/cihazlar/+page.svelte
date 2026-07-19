<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getCihazlar, cihazEkle, cihazGüncelle, cihazSil, cihazÇevrimİçiMi } from '$lib/supabase/devices';

	let cihazlar = [];
	let loading = true;
	let errorMsg = '';
	let yeniCihazAdı = '';
	let ekleniyor = false;
	let kopyalananId = null;

	onMount(async () => {
		if (!$user) return;
		try {
			cihazlar = await getCihazlar($user.id);
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	async function ekle() {
		if (!yeniCihazAdı.trim() || ekleniyor) return;
		ekleniyor = true;
		errorMsg = '';
		try {
			const yeni = await cihazEkle($user.id, yeniCihazAdı.trim());
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
			const güncel = await cihazGüncelle(cihaz.id, { fiş_kapali: !cihaz.fiş_kapali });
			cihazlar = cihazlar.map((c) => (c.id === güncel.id ? güncel : c));
		} catch (e) {
			errorMsg = e.message;
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
			<input type="text" bind:value={yeniCihazAdı} placeholder={$_('cihazlar.cihaz_adi_placeholder')} />
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
				<div class="card cihaz-card">
					<div class="cihaz-top">
						<span class="cihaz-adi font-display">{cihaz.cihaz_adı}</span>
						<span class="durum-badge" class:online={çevrimİçi}>
							<span class="durum-nokta"></span>
							{çevrimİçi ? $_('cihazlar.cevrimici') : $_('cihazlar.cevrimdisi')}
						</span>
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
		margin: 0 0 12px;
	}
	.ekle-card form {
		display: flex;
		gap: 10px;
	}
	.ekle-card input {
		flex: 1;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
	}
	.btn-primary {
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
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
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
