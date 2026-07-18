<script>
	import '../app.css';
	import '$lib/i18n';
	import { isLoading } from 'svelte-i18n';
	import { theme } from '$stores/theme';
	import { onMount } from 'svelte';

	onMount(() => {
		theme.init();
	});
</script>

{#if $isLoading}
	<!-- çeviri dosyaları yüklenene kadar boş -->
{:else}
	<slot />
{/if}
