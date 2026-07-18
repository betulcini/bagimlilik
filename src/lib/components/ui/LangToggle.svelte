<script>
	import { locale } from 'svelte-i18n';
	import { browser } from '$app/environment';

	function setLocale(value) {
		locale.set(value);
		if (browser) localStorage.setItem('dil', value);
	}
</script>

<div class="lang-toggle">
	<button class:active={$locale === 'tr'} on:click={() => setLocale('tr')}>TR</button>
	<button class:active={$locale === 'en'} on:click={() => setLocale('en')}>EN</button>
</div>

<style>
	.lang-toggle {
		display: flex;
		border: 1px solid var(--border);
		border-radius: 999px;
		overflow: hidden;
	}
	.lang-toggle button {
		border: none;
		background: var(--bg-elevated);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
		padding: 8px 12px;
		cursor: pointer;
		letter-spacing: 0.02em;
	}
	.lang-toggle button.active {
		background: var(--accent);
		color: var(--bg-elevated);
	}
</style>
