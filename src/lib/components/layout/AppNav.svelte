<script>
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LangToggle from '$components/ui/LangToggle.svelte';

	const links = [
		{ href: '/dashboard', key: 'nav.dashboard' },
		{ href: '/ev', key: 'nav.ev' },
		{ href: '/rapor', key: 'nav.rapor' },
		{ href: '/kesif', key: 'nav.kesif' },
		{ href: '/mesajlar', key: 'nav.mesajlar' },
		{ href: '/cihazlar', key: 'nav.cihazlar' }
	];

	async function cikisYap() {
		await supabase.auth.signOut();
		goto('/giris');
	}
</script>

<header class="app-nav">
	<a href="/dashboard" class="logo font-display">{$_("nav.logo")}</a>

	<nav class="links">
		{#each links as link}
			<a href={link.href} class:active={$page.url.pathname === link.href}>{$_(link.key)}</a>
		{/each}
	</nav>

	<div class="actions">
		<LangToggle />
		<ThemeToggle />
		<button class="logout" on:click={cikisYap}>{$_('nav.cikis')}</button>
	</div>
</header>

<style>
	.app-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 14px 24px;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}
	.logo {
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
		font-size: 1.1rem;
		white-space: nowrap;
	}
	.links {
		display: flex;
		gap: 4px;
		flex: 1;
		justify-content: center;
	}
	.links a {
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 8px 14px;
		border-radius: 8px;
	}
	.links a:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.links a.active {
		color: var(--accent);
		background: var(--accent-soft);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.logout {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		border-radius: 8px;
		padding: 8px 14px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.logout:hover {
		border-color: var(--warn);
		color: var(--warn);
	}

	@media (max-width: 720px) {
		.app-nav {
			flex-wrap: wrap;
			padding: 12px 16px;
		}
		.links {
			order: 3;
			width: 100%;
			justify-content: space-between;
			padding-top: 8px;
			border-top: 1px solid var(--border);
		}
		.links a {
			padding: 8px 6px;
			font-size: 0.8rem;
		}
	}
</style>
