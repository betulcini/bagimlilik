<script>
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LangToggle from '$components/ui/LangToggle.svelte';

	let kullanıcıAdı = '';
	let eposta = '';
	let şifre = '';
	let gönderiliyor = false;
	let hata = '';
	let epostaDoğrulamaBekleniyor = false;

	let davetKodu = '';
	onMount(() => {
		davetKodu = $page.url.searchParams.get('ref') ?? '';
	});

	async function kayitOl() {
		hata = '';
		if (şifre.length < 6) {
			hata = $_('auth.sifre_min_uyari');
			return;
		}
		gönderiliyor = true;
		try {
			const { data, error } = await supabase.auth.signUp({
				email: eposta,
				password: şifre,
				options: { data: { kullanici_adi: kullanıcıAdı.trim(), davet_kodu: davetKodu || null } }
			});
			if (error) throw error;

			if (data.session) {
				goto('/dashboard');
			} else {
				epostaDoğrulamaBekleniyor = true;
			}
		} catch (e) {
			hata = e.message;
		} finally {
			gönderiliyor = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('auth.kayit')}</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-topbar">
		<a href="/" class="logo font-display">{$_("nav.logo")}</a>
		<div class="auth-toggles">
			<LangToggle />
			<ThemeToggle />
		</div>
	</div>

	<div class="auth-card">
		{#if epostaDoğrulamaBekleniyor}
			<h1 class="font-display">{$_('auth.kayit_baslik')}</h1>
			<p class="muted">{$_('auth.eposta_dogrulama_mesaji')}</p>
		{:else}
			<h1 class="font-display">{$_('auth.kayit_baslik')}</h1>
			<p class="muted">{$_('auth.kayit_aciklama')}</p>
			{#if davetKodu}
				<p class="davet-notu">🎉 {$_('auth.davetle_geldin')}</p>
			{/if}

			<form on:submit|preventDefault={kayitOl}>
				<label>
					{$_('auth.kullanici_adi')}
					<input type="text" bind:value={kullanıcıAdı} placeholder={$_('auth.kullanici_adi_placeholder')} required />
				</label>
				<label>
					{$_('auth.eposta')}
					<input type="email" bind:value={eposta} required />
				</label>
				<label>
					{$_('auth.sifre')}
					<input type="password" bind:value={şifre} minlength="6" required />
				</label>

				{#if hata}<p class="error">{hata}</p>{/if}

				<button class="btn-primary" type="submit" disabled={gönderiliyor}>
					{gönderiliyor ? $_('auth.gonderiliyor') : $_('auth.kayit_buton')}
				</button>
			</form>

			<p class="switch-link">
				{$_('auth.hesabin_var_mi')} <a href="/giris">{$_('auth.giris_yap_link')}</a>
			</p>
		{/if}
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
	.davet-notu {
		background: var(--accent-soft);
		color: var(--accent);
		border-radius: 10px;
		padding: 10px 14px;
		font-size: 0.85rem;
		font-weight: 600;
		margin: -12px 0 20px;
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
