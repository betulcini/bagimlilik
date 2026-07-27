<script>
	import { sesEtkin } from '$stores/ses';
</script>

<button class="toggle" on:click={() => sesEtkin.toggle()} aria-label="Sesi aç/kapat" aria-pressed={$sesEtkin} title="Sesli yönlendirme">
	{#if $sesEtkin}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
			<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
		</svg>
	{:else}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
			<line x1="23" y1="9" x2="17" y2="15" />
			<line x1="17" y1="9" x2="23" y2="15" />
		</svg>
	{/if}
</button>

<style>
	.toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text);
		cursor: pointer;
	}
	.toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
