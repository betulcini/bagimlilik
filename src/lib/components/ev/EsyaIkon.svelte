<script>
	// 24x24 koordinat sisteminde basit, düz renkli ikonlar.
	// Emoji yerine kullanılıyor çünkü emoji render'ı işletim sistemine göre değişiyor/eksik kalabiliyor.
	export let ref = '';
</script>

{#if ref === 'hali'}
	<g>
		<rect x="3" y="6" width="18" height="12" rx="2" fill="#b5482f" />
		<rect x="6" y="9" width="12" height="6" rx="1" fill="none" stroke="#f6f3ee" stroke-width="1" opacity="0.7" />
	</g>
{:else if ref === 'kilim'}
	<g>
		<rect x="3" y="6" width="18" height="12" rx="2" fill="#c69a3a" />
		<line x1="3" y1="10" x2="21" y2="10" stroke="#f6f3ee" stroke-width="1" opacity="0.6" />
		<line x1="3" y1="14" x2="21" y2="14" stroke="#f6f3ee" stroke-width="1" opacity="0.6" />
	</g>
{:else if ref === 'saksi'}
	<g>
		<path d="M8 14 L16 14 L14.5 21 L9.5 21 Z" fill="#c69a3a" />
		<circle cx="12" cy="9" r="3.4" fill="#2f6f5e" />
		<circle cx="8.5" cy="11" r="2.6" fill="#3f8a74" />
		<circle cx="15.5" cy="11" r="2.6" fill="#3f8a74" />
	</g>
{:else if ref === 'buyuk_bitki'}
	<g>
		<path d="M7 15 L17 15 L15.5 22 L8.5 22 Z" fill="#8a5a2b" />
		<path d="M12 15 C12 9 8 8 6 4 C11 5 12 9 12 13 Z" fill="#2f6f5e" />
		<path d="M12 15 C12 8 16 7 18 3 C13 5 12 9 12 13 Z" fill="#3f8a74" />
		<path d="M12 15 C12 10 12 9 12 5 C13 8 13 11 12 15 Z" fill="#4fae94" />
	</g>
{:else if ref === 'sandalye'}
	<g>
		<rect x="6" y="4" width="10" height="3" rx="1" fill="#8a5a2b" />
		<rect x="6" y="10" width="10" height="3" rx="1" fill="#a9713a" />
		<line x1="7" y1="13" x2="7" y2="21" stroke="#5c3a1c" stroke-width="2" stroke-linecap="round" />
		<line x1="15" y1="13" x2="15" y2="21" stroke="#5c3a1c" stroke-width="2" stroke-linecap="round" />
	</g>
{:else if ref === 'koltuk'}
	<g>
		<rect x="4" y="12" width="16" height="7" rx="2.5" fill="#2f6f5e" />
		<rect x="3" y="9" width="4" height="8" rx="1.5" fill="#3f8a74" />
		<rect x="17" y="9" width="4" height="8" rx="1.5" fill="#3f8a74" />
		<rect x="6" y="9.5" width="12" height="4" rx="1.5" fill="#4fae94" />
	</g>
{:else if ref === 'kitaplik'}
	<g>
		<rect x="4" y="4" width="16" height="16" rx="1" fill="none" stroke="#8a5a2b" stroke-width="1.6" />
		<line x1="4" y1="12" x2="20" y2="12" stroke="#8a5a2b" stroke-width="1.6" />
		<rect x="6" y="6" width="2.4" height="5" fill="#b5482f" />
		<rect x="9" y="6" width="2.4" height="5" fill="#c69a3a" />
		<rect x="12" y="6" width="2.4" height="5" fill="#2f6f5e" />
		<rect x="6" y="14" width="2.4" height="5" fill="#4fae94" />
		<rect x="9" y="14" width="2.4" height="5" fill="#b5482f" />
	</g>
{:else if ref === 'saat'}
	<g>
		<circle cx="12" cy="12" r="8.5" fill="none" stroke="#8a5a2b" stroke-width="1.8" />
		<line x1="12" y1="12" x2="12" y2="7" stroke="#1e1b16" stroke-width="1.4" stroke-linecap="round" />
		<line x1="12" y1="12" x2="15.2" y2="13.6" stroke="#1e1b16" stroke-width="1.4" stroke-linecap="round" />
		<circle cx="12" cy="12" r="1.2" fill="#1e1b16" />
	</g>
{:else if ref === 'tablo'}
	<g>
		<rect x="3" y="3" width="18" height="18" rx="1.5" fill="none" stroke="#c69a3a" stroke-width="2.2" />
		<circle cx="8.5" cy="9" r="2" fill="#c69a3a" />
		<path d="M4 18 L9.5 12 L13.5 16 L16.5 13 L20 18 Z" fill="#2f6f5e" opacity="0.85" />
	</g>
{:else if ref === 'kupa'}
	<g>
		<path d="M8 4 H16 V9 C16 12.5 13.5 14 12 14 C10.5 14 8 12.5 8 9 Z" fill="#c69a3a" />
		<path d="M8 5 C5.5 5 5 8 8 9" fill="none" stroke="#c69a3a" stroke-width="1.6" />
		<path d="M16 5 C18.5 5 19 8 16 9" fill="none" stroke="#c69a3a" stroke-width="1.6" />
		<rect x="10.6" y="14" width="2.8" height="4" fill="#c69a3a" />
		<rect x="8" y="18" width="8" height="2.4" rx="1" fill="#a9713a" />
	</g>
{:else}
	<g>
		<rect x="5" y="5" width="14" height="14" rx="2" fill="#c69a3a" />
	</g>
{/if}
