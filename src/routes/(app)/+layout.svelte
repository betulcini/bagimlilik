<script>
	import { onMount } from 'svelte';
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
	<AppNav />
	<main class="app-main">
		<slot />
	</main>
{/if}

<style>
	.app-main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 32px 20px 60px;
	}
</style>
