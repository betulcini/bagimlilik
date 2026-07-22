<script>
	import { _ } from 'svelte-i18n';
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LangToggle from '$components/ui/LangToggle.svelte';
</script>

<svelte:head>
	<title>{$_('landing.baslik')}</title>
</svelte:head>

<div class="page">
	<header class="nav">
		<span class="logo font-display">{$_("nav.logo")}</span>
		<div class="nav-actions">
			<LangToggle />
			<ThemeToggle />
			<a class="btn-ghost" href="/giris">{$_('landing.giris_yap')}</a>
		</div>
	</header>

	<section class="hero">
		<div class="hero-text">
			<h1 class="font-display">{$_('landing.baslik')}</h1>
			<p class="hero-desc">{$_('landing.aciklama')}</p>
			<div class="hero-cta">
				<a class="btn-primary" href="/kayit">{$_('landing.basla')}</a>
				<a class="btn-ghost" href="/giris">{$_('landing.giris_yap')}</a>
			</div>
		</div>

		<div class="hero-visual" aria-hidden="true">
			<svg viewBox="0 0 320 300" class="house-svg">
				<ellipse cx="160" cy="266" rx="120" ry="14" fill="var(--border)" opacity="0.5" />

				<polygon points="160,40 260,110 60,110" fill="var(--accent)" />
				<rect x="80" y="110" width="160" height="130" rx="4" fill="var(--bg-elevated)" stroke="var(--border)" stroke-width="2" />

				<rect x="146" y="182" width="28" height="58" rx="3" fill="var(--accent)" opacity="0.85" />

				<rect class="window w1" x="98" y="132" width="30" height="30" rx="3" />
				<rect class="window w2" x="146" y="132" width="30" height="30" rx="3" />
				<rect class="window w3" x="194" y="132" width="30" height="30" rx="3" />

				<rect x="200" y="58" width="14" height="34" fill="var(--text-muted)" opacity="0.6" />
			</svg>

			<div class="day-badge">
				<span class="day-number font-display">47</span>
				<span class="day-label">gün</span>
			</div>
		</div>
	</section>

	<section class="features">
		<article class="feature-card">
			<div class="feature-icon">⏱</div>
			<h3 class="font-display">{$_('landing_ozellik.sayac_baslik')}</h3>
			<p>{$_('landing_ozellik.sayac_aciklama')}</p>
		</article>
		<article class="feature-card">
			<div class="feature-icon">🏠</div>
			<h3 class="font-display">{$_('landing_ozellik.ev_baslik')}</h3>
			<p>{$_('landing_ozellik.ev_aciklama')}</p>
		</article>
		<article class="feature-card">
			<div class="feature-icon">🤝</div>
			<h3 class="font-display">{$_('landing_ozellik.sosyal_baslik')}</h3>
			<p>{$_('landing_ozellik.sosyal_aciklama')}</p>
		</article>
	</section>

	<footer class="footer">
		<span>© {new Date().getFullYear()}</span>
	</footer>
</div>

<style>
	.page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 24px 20px 60px;
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0 40px;
	}
	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--accent);
	}
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn-primary,
	.btn-ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 11px 22px;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		transition: all 0.15s ease;
	}
	.btn-primary {
		background: var(--accent);
		color: var(--bg-elevated);
	}
	.btn-primary:hover {
		filter: brightness(1.08);
	}
	.btn-ghost {
		color: var(--text);
		border: 1px solid var(--border);
		background: transparent;
	}
	.btn-ghost:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.hero {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 48px;
		align-items: center;
		padding: 40px 0 80px;
	}
	.hero-text h1 {
		font-size: clamp(2.1rem, 4vw, 3.1rem);
		line-height: 1.15;
		margin: 0 0 20px;
		font-weight: 500;
	}
	.hero-desc {
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--text-muted);
		max-width: 46ch;
		margin: 0 0 32px;
	}
	.hero-cta {
		display: flex;
		gap: 14px;
	}

	.hero-visual {
		position: relative;
		display: flex;
		justify-content: center;
	}
	.house-svg {
		width: 100%;
		max-width: 340px;
	}
	.window {
		fill: var(--border);
		animation: glow 6s ease-in-out infinite;
	}
	.w1 {
		animation-delay: 0s;
	}
	.w2 {
		animation-delay: 2s;
	}
	.w3 {
		animation-delay: 4s;
	}
	@keyframes glow {
		0%,
		55%,
		100% {
			fill: var(--border);
		}
		15%,
		40% {
			fill: var(--gold);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.window {
			animation: none;
			fill: var(--gold);
		}
	}

	.day-badge {
		position: absolute;
		bottom: 8px;
		right: 6%;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 10px 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
	}
	.day-number {
		font-size: 1.6rem;
		font-weight: 600;
		color: var(--accent);
		line-height: 1;
	}
	.day-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		padding: 20px 0 60px;
	}
	.feature-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 28px 24px;
	}
	.feature-icon {
		font-size: 1.6rem;
		margin-bottom: 12px;
	}
	.feature-card h3 {
		font-size: 1.15rem;
		font-weight: 500;
		margin: 0 0 10px;
	}
	.feature-card p {
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--text-muted);
		margin: 0;
	}

	.footer {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.85rem;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}

	@media (max-width: 800px) {
		.hero {
			grid-template-columns: 1fr;
			padding-bottom: 40px;
		}
		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
