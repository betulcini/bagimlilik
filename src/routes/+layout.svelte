<script>
	import '../app.css';
	import '$lib/i18n';
	import { isLoading, locale } from 'svelte-i18n';
	import { theme } from '$stores/theme';
	import { sesEtkin } from '$stores/ses';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	onMount(() => {
		theme.init();
		sesEtkin.init();
	});

	$: if (browser && $locale) {
		document.documentElement.lang = $locale;
	}
</script>

{#if $isLoading}
	<!-- çeviri dosyaları yüklenene kadar boş -->
{:else}
	<slot />
{/if}
