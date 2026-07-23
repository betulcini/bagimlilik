<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import { user, authLoading } from '$stores/user';
	import AppNav from '$components/layout/AppNav.svelte';

	onMount(async () => {
		const { data } = await supabase.auth.getSession();
		if (!data.session) {
			goto('/giris');
			return;
		}
		user.set(data.session.user);
		authLoading.set(false);

		supabase.auth.onAuthStateChange((_event, session) => {
			if (!session) {
				user.set(null);
				goto('/giris');
			} else {
				user.set(session.user);
			}
		});
	});
</script>

{#if !$authLoading}
	<a href="#ana-icerik" class="skip-link">{$_('erisilebilirlik.icerige_gec')}</a>
	<AppNav />
	<main class="app-main" id="ana-icerik">
		<slot />
	</main>
{/if}

<style>
	.app-main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 32px 20px 60px;
	}
	.skip-link {
		position: absolute;
		left: -9999px;
		top: 0;
		background: var(--accent);
		color: var(--bg-elevated);
		padding: 12px 20px;
		border-radius: 0 0 8px 0;
		font-weight: 600;
		z-index: 100;
		text-decoration: none;
	}
	.skip-link:focus {
		left: 0;
	}
</style>
