<script>
	import { _ } from 'svelte-i18n';
	import RozetIkon from './RozetIkon.svelte';

	export let kataloglar = [];
	export let kazanılmışIdler = new Set();

	const renkler = ['#a9713a', '#8a8f99', '#c69a3a', '#4fae94', '#3f8a74', '#2f6f5e', '#b5482f'];
</script>

<div class="rozet-satiri">
	{#each kataloglar as rozet, i (rozet.id)}
		{@const kazanildi = kazanılmışIdler.has(rozet.id)}
		<div class="rozet-chip" class:kazanildi title="{rozet.ad} — {rozet.açıklama}">
			<RozetIkon renk={renkler[i % renkler.length]} {kazanildi} />
			<span class="rozet-ad">{rozet.ad}</span>
			{#if !kazanildi}
				<span class="rozet-kilit">{rozet.gerekli_gün_sayısı} {$_('dashboard.gun')}</span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.rozet-satiri {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.rozet-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 76px;
		opacity: 0.55;
		text-align: center;
	}
	.rozet-chip.kazanildi {
		opacity: 1;
	}
	.rozet-ad {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
	}
	.rozet-kilit {
		font-size: 0.65rem;
		color: var(--text-muted);
	}
</style>
