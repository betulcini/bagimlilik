<script>
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LangToggle from '$components/ui/LangToggle.svelte';

	let eposta = '';
	let şifre = '';
	let gönderiliyor = false;
	let hata = '';

	async function girişYap() {
		hata = '';
		gönderiliyor = true;
		try {
			const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: şifre });
			if (error) throw error;
			goto('/dashboard');
		} catch (e) {
			hata = e.message;
		} finally {
			gönderiliyor = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('auth.giris')}</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-topbar">
		<a href="/" class="logo font-display">ev&nbsp;dön</a>
		<div class="auth-toggles">
			<LangToggle />
			<ThemeToggle />
		</div>
	</div>

	<div class="auth-card">
		<h1 class="font-display">{$_('auth.giris_baslik')}</h1>
		<p class="muted">{$_('auth.giris_aciklama')}</p>

		<form on:submit|preventDefault={girişYap}>
			<label>
				{$_('auth.eposta')}
				<input type="email" bind:value={eposta} required />
			</label>
			<label>
				{$_('auth.sifre')}
				<input type="password" bind:value={şifre} required />
			</label>

			{#if hata}<p class="error">{hata}</p>{/if}

			<button class="btn-primary" type="submit" disabled={gönderiliyor}>
				{gönderiliyor ? $_('auth.gonderiliyor') : $_('auth.giris_buton')}
			</button>
		</form>

		<p class="switch-link">
			{$_('auth.hesabin_yok_mu')} <a href="/kayit">{$_('auth.kayit_ol_link')}</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.auth-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
	}
	.logo {
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
		font-size: 1.15rem;
	}
	.auth-toggles {
		display: flex;
		gap: 10px;
	}

	.auth-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 400px;
		margin: 0 auto;
		width: 100%;
		padding: 20px 24px 80px;
	}
	.auth-card h1 {
		font-size: 1.7rem;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.muted {
		color: var(--text-muted);
		font-size: 0.92rem;
		line-height: 1.5;
		margin: 0 0 24px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	input {
		font-family: inherit;
		font-size: 0.95rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text);
	}
	input:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.error {
		color: var(--warn);
		font-size: 0.85rem;
		margin: 0;
	}

	.btn-primary {
		background: var(--accent);
		color: var(--bg-elevated);
		border: none;
		border-radius: 10px;
		padding: 13px 20px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		margin-top: 4px;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.switch-link {
		margin-top: 22px;
		font-size: 0.88rem;
		color: var(--text-muted);
		text-align: center;
	}
	.switch-link a {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}
</style>
