<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getDiğerProfiller, getTopluUserHouse } from '$lib/supabase/social';
	import { getBasarimlar, getKullanıcıBasarımları } from '$lib/supabase/achievements';
	import OdaGorunumu from '$components/ev/OdaGorunumu.svelte';
	import RozetSatiri from '$components/rozet/RozetSatiri.svelte';

	let profiller = [];
	let evlerByUser = {};
	let loading = true;
	let errorMsg = '';
	let seçiliProfil = null;
	let rozetKataloglar = [];
	let seçiliProfilRozetIdler = new Set();

	onMount(async () => {
		if (!$user) return;
		try {
			profiller = await getDiğerProfiller($user.id);
			const userIdList = profiller.map((p) => p.id);
			const tümEşyalar = await getTopluUserHouse(userIdList);
			evlerByUser = tümEşyalar.reduce((acc, uh) => {
				(acc[uh.user_id] ??= []).push(uh);
				return acc;
			}, {});
			rozetKataloglar = await getBasarimlar();
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	async function profilSeç(profil) {
		seçiliProfil = profil;
		seçiliProfilRozetIdler = new Set();
		try {
			const rozetler = await getKullanıcıBasarımları(profil.id);
			seçiliProfilRozetIdler = new Set(rozetler.map((r) => r.achievement_id));
		} catch (e) {
			errorMsg = e.message;
		}
	}

	function eşyaSayısı(profileId) {
		return (evlerByUser[profileId] ?? []).filter((uh) => uh.konum_x !== -1).length;
	}
</script>

<svelte:head>
	<title>{$_('nav.kesif')}</title>
</svelte:head>

<div class="kesif-header">
	<h1 class="font-display">{$_('kesif.baslik')}</h1>
	<p class="muted">{$_('kesif.aciklama')}</p>
</div>

{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

{#if loading}
	<p class="muted">…</p>
{:else if seçiliProfil}
	<button class="geri-btn" on:click={() => (seçiliProfil = null)}>{$_('kesif.geri')}</button>
	<div class="detay-card">
		<div class="detay-header">
			<span class="avatar">{seçiliProfil.kullanici_adi.slice(0, 1).toUpperCase()}</span>
			<span class="detay-isim font-display">{seçiliProfil.kullanici_adi}</span>
		</div>
		<div class="room-card">
			<OdaGorunumu yerleşmişler={(evlerByUser[seçiliProfil.id] ?? []).filter((uh) => uh.konum_x !== -1)} readonly />
		</div>
		{#if seçiliProfilRozetIdler.size > 0}
			<div class="detay-rozetler">
				<RozetSatiri kataloglar={rozetKataloglar} kazanılmışIdler={seçiliProfilRozetIdler} />
			</div>
		{/if}
	</div>
{:else if profiller.length === 0}
	<p class="muted">{$_('kesif.bos')}</p>
{:else}
	<div class="gallery-grid">
		{#each profiller as profil (profil.id)}
			<button class="gallery-card" on:click={() => profilSeç(profil)}>
				<span class="avatar">{profil.kullanici_adi.slice(0, 1).toUpperCase()}</span>
				<span class="gallery-isim">{profil.kullanici_adi}</span>
				<span class="gallery-esya muted">{eşyaSayısı(profil.id)} {$_('kesif.esya_sayisi')}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.kesif-header {
		margin-bottom: 24px;
	}
	.kesif-header h1 {
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

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 16px;
	}
	.gallery-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 22px 16px;
		cursor: pointer;
		font-family: inherit;
	}
	.gallery-card:hover {
		border-color: var(--accent);
	}
	.avatar {
		width: 48px;
		height: 48px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
	}
	.gallery-isim {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text);
	}
	.gallery-esya {
		font-size: 0.78rem;
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
	.detay-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 24px;
	}
	.detay-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}
	.detay-isim {
		font-size: 1.2rem;
		font-weight: 500;
	}
	.room-card {
		display: flex;
		justify-content: center;
	}
	.detay-rozetler {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}
</style>
