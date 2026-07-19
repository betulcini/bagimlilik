<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getActiveHabit } from '$lib/supabase/habits';
	import { getHouseItems, getUserHouse, purchaseItem, placeItem, pickUpItem } from '$lib/supabase/house';
	import { getBonusBakiye } from '$lib/supabase/coins';
	import OdaGorunumu from '$components/ev/OdaGorunumu.svelte';
	import EsyaIkon from '$components/ev/EsyaIkon.svelte';

	let habit = null;
	let items = [];
	let userHouse = [];
	let bonusBakiye = 0;
	let loading = true;
	let errorMsg = '';
	let seçiliEnvanterId = null;
	let işlemDevamEdiyor = false;

	onMount(async () => {
		if (!$user) return;
		try {
			habit = await getActiveHabit($user.id);
			if (habit) {
				[items, userHouse, bonusBakiye] = await Promise.all([
					getHouseItems(),
					getUserHouse($user.id),
					getBonusBakiye($user.id)
				]);
			}
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	$: gün = habit ? Math.max(0, Math.floor((Date.now() - new Date(habit.başlangıç_tarihi).getTime()) / 86400000)) : 0;
	$: kazanılanCoin = gün * 10;
	$: harcananCoin = userHouse.reduce((toplam, uh) => toplam + (uh.house_items?.fiyat ?? 0), 0);
	$: bakiye = kazanılanCoin + bonusBakiye - harcananCoin;

	$: envanter = userHouse.filter((uh) => uh.konum_x === -1);
	$: yerleşmişler = userHouse.filter((uh) => uh.konum_x !== -1);
	$: sahipOlunanItemIdleri = new Set(userHouse.map((uh) => uh.item_id));

	function envanterÖğesineTıkla(uh) {
		seçiliEnvanterId = seçiliEnvanterId === uh.id ? null : uh.id;
	}

	async function eşyaSatınAl(item) {
		if (bakiye < item.fiyat || gün < item.gerekli_gün_sayısı || işlemDevamEdiyor) return;
		işlemDevamEdiyor = true;
		errorMsg = '';
		try {
			const yeni = await purchaseItem($user.id, item.id);
			userHouse = [...userHouse, yeni];
		} catch (e) {
			errorMsg = e.message;
		} finally {
			işlemDevamEdiyor = false;
		}
	}

	async function eşyayıEnvantereAl(uh) {
		işlemDevamEdiyor = true;
		errorMsg = '';
		try {
			const güncel = await pickUpItem(uh.id);
			userHouse = userHouse.map((u) => (u.id === güncel.id ? güncel : u));
		} catch (e) {
			errorMsg = e.message;
		} finally {
			işlemDevamEdiyor = false;
		}
	}

	async function hücreyeYerleştir({ detail: { col, row } }) {
		if (seçiliEnvanterId == null || işlemDevamEdiyor) return;
		işlemDevamEdiyor = true;
		errorMsg = '';
		try {
			const güncel = await placeItem(seçiliEnvanterId, col, row);
			userHouse = userHouse.map((uh) => (uh.id === güncel.id ? güncel : uh));
			seçiliEnvanterId = null;
		} catch (e) {
			errorMsg = e.message;
		} finally {
			işlemDevamEdiyor = false;
		}
	}

	// eşya ikonları artık EsyaIkon.svelte içinde (emoji yerine SVG, cihazdan bağımsız görünür)
</script>

<svelte:head>
	<title>{$_('nav.ev')}</title>
</svelte:head>

{#if loading}
	<p class="muted">…</p>
{:else if !habit}
	<div class="card empty-state">
		<p>{$_('ev.habit_yok')}</p>
		<a class="btn-primary" href="/dashboard">{$_('ev.habit_yok_link')}</a>
	</div>
{:else}
	<div class="ev-layout">
		<div class="room-column">
			<div class="balance-bar">
				<span class="balance-label">{$_('ev.bakiye')}</span>
				<span class="balance-value font-display">🪙 {bakiye}</span>
			</div>

			{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

			<div class="room-card">
				<OdaGorunumu {yerleşmişler} on:tileClick={hücreyeYerleştir} on:itemClick={(e) => eşyayıEnvantereAl(e.detail)} />
			</div>
			<p class="hint">{$_('ev.grid_ipucu')}</p>
		</div>

		<aside class="side-column">
			<section class="card">
				<h2 class="font-display">{$_('ev.envanter_baslik')}</h2>
				{#if envanter.length === 0}
					<p class="muted small">{$_('ev.envanter_bos')}</p>
				{:else}
					<p class="hint small">{$_('ev.envanter_ipucu')}</p>
					<div class="inventory-list">
						{#each envanter as uh (uh.id)}
							<button
								class="inventory-chip"
								class:selected={seçiliEnvanterId === uh.id}
								on:click={() => envanterÖğesineTıkla(uh)}
							>
								<svg width="18" height="18" viewBox="0 0 24 24"><EsyaIkon ref={uh.house_items?.görsel_referans} /></svg>
								{uh.house_items?.ad}
							</button>
						{/each}
					</div>
				{/if}
			</section>

			<section class="card">
				<h2 class="font-display">{$_('ev.magaza_baslik')}</h2>
				<div class="shop-list">
					{#each items as item (item.id)}
						{@const sahip = sahipOlunanItemIdleri.has(item.id)}
						{@const kilitli = gün < item.gerekli_gün_sayısı}
						<div class="shop-item" class:nadir={item.nadir_mi}>
							<svg class="shop-emoji" width="26" height="26" viewBox="0 0 24 24"><EsyaIkon ref={item.görsel_referans} /></svg>
							<div class="shop-info">
								<span class="shop-name">
									{item.ad}
									{#if item.nadir_mi}<span class="badge-nadir">{$_('ev.nadir_rozet')}</span>{/if}
								</span>
								<span class="shop-price">🪙 {item.fiyat}</span>
							</div>
							{#if sahip}
								<span class="shop-status owned">{$_('ev.sahipsin')}</span>
							{:else if kilitli}
								<span class="shop-status locked">🔒 {item.gerekli_gün_sayısı} {$_('ev.kilitli')}</span>
							{:else}
								<button
									class="btn-buy"
									disabled={bakiye < item.fiyat || işlemDevamEdiyor}
									on:click={() => eşyaSatınAl(item)}
								>
									{$_('ev.satin_al')}
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		</aside>
	</div>
{/if}

<style>
	.card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 24px;
	}
	.muted {
		color: var(--text-muted);
	}
	.small {
		font-size: 0.85rem;
	}
	.error {
		color: var(--warn);
		font-size: 0.85rem;
	}
	.hint {
		color: var(--text-muted);
		font-size: 0.82rem;
		margin: 10px 4px 0;
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

	.ev-layout {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 24px;
		align-items: start;
	}

	.balance-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 14px 20px;
		margin-bottom: 14px;
	}
	.balance-label {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.balance-value {
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--gold);
	}

	.room-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 20px;
		display: flex;
		justify-content: center;
	}

	.side-column {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.side-column h2 {
		font-size: 1.1rem;
		font-weight: 500;
		margin: 0 0 12px;
	}

	.inventory-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.inventory-chip {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		border-radius: 999px;
		padding: 8px 14px;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.inventory-chip.selected {
		border-color: var(--gold);
		background: var(--accent-soft);
	}

	.shop-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.shop-item {
		display: flex;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 12px 14px;
	}
	.shop-item.nadir {
		border-color: var(--gold);
	}
	.shop-emoji {
		font-size: 1.4rem;
	}
	.shop-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 3px;
	}
	.shop-name {
		font-size: 0.92rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.badge-nadir {
		font-size: 0.65rem;
		background: var(--gold);
		color: var(--bg-elevated);
		padding: 1px 7px;
		border-radius: 999px;
		font-weight: 700;
	}
	.shop-price {
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.shop-status {
		font-size: 0.78rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.shop-status.owned {
		color: var(--accent);
	}
	.shop-status.locked {
		color: var(--text-muted);
	}
	.btn-buy {
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 8px;
		padding: 8px 14px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-buy:disabled {
		opacity: 0.5;
		cursor: default;
	}

	@media (max-width: 860px) {
		.ev-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
