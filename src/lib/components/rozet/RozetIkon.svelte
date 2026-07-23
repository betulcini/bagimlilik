<script>
	export let renk = '#c69a3a';
	export let kazanildi = true;
</script>

<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
	<circle cx="12" cy="10" r="7" fill={kazanildi ? renk : 'var(--border)'} />
	<circle cx="12" cy="10" r="4.6" fill="none" stroke={kazanildi ? 'white' : 'var(--bg)'} stroke-width="1.2" opacity="0.85" />
	<path
		d="M9 15.5 L7 22 L12 19.3 L17 22 L15 15.5"
		fill={kazanildi ? renk : 'var(--border)'}
		opacity={kazanildi ? 1 : 0.7}
	/>
</svg>
