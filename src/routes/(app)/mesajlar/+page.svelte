<script>
	import { onMount, tick } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { user } from '$stores/user';
	import { getActiveHabit } from '$lib/supabase/habits';
	import { getDiğerProfiller, getProfillerByIds } from '$lib/supabase/social';
	import { getMesajlar, mesajGönder, anonimEşleş } from '$lib/supabase/messages';
	import { getEngellenenler, engelle, engelKaldır } from '$lib/supabase/blocks';
	import { şikayetGönder } from '$lib/supabase/sikayetler';
	import { focusTrap } from '$lib/actions/focusTrap';
	import { supabase } from '$lib/supabase/client';

	let habit = null;
	let mesajlar = [];
	let profilMap = {}; // id -> {id, kullanici_adi}
	let seçiliSohbetId = null;
	let yeniMetin = '';
	let loading = true;
	let eşleşmeDurumu = ''; // '', 'aranıyor', 'bulunamadi'
	let yeniSohbetAçık = false;
	let gönderiliyor = false;
	let errorMsg = '';
	let mesajListesiEl;
	let şikayetModalMesajı = null; // şikayet edilecek mesaj objesi ya da null
	let şikayetSebebi = '';
	let şikayetGönderiliyor = false;
	let şikayetTeşekkürGösteriliyor = false;
	let engellenenIdler = new Set();
	let engellenenlerAçık = false;

	onMount(async () => {
		if (!$user) return;
		try {
			habit = await getActiveHabit($user.id);
			mesajlar = await getMesajlar($user.id);

			const diğerIdler = [...new Set(mesajlar.map((m) => (m.gönderen_id === $user.id ? m.alıcı_id : m.gönderen_id)))];
			const profiller = await getProfillerByIds(diğerIdler);
			profilMap = Object.fromEntries(profiller.map((p) => [p.id, p]));

			const engellenenler = await getEngellenenler($user.id);
			engellenenIdler = new Set(engellenenler.map((e) => e.engellenen_id));
			const engellenenProfilIdler = engellenenler.map((e) => e.engellenen_id).filter((id) => !profilMap[id]);
			if (engellenenProfilIdler.length > 0) {
				const eksikProfiller = await getProfillerByIds(engellenenProfilIdler);
				for (const p of eksikProfiller) profilMap[p.id] = p;
			}
		} catch (e) {
			errorMsg = e.message;
		} finally {
			loading = false;
		}
	});

	$: sohbetListesi = (() => {
		const map = new Map();
		for (const m of mesajlar) {
			const diğerId = m.gönderen_id === $user?.id ? m.alıcı_id : m.gönderen_id;
			if (engellenenIdler.has(diğerId)) continue;
			map.set(diğerId, m); // sıralı olduğu için en son mesaj kalır
		}
		return [...map.entries()]
			.map(([id, sonMesaj]) => ({ id, sonMesaj }))
			.sort((a, b) => new Date(b.sonMesaj.tarih) - new Date(a.sonMesaj.tarih));
	})();

	$: seçiliSohbetMesajları = seçiliSohbetId
		? mesajlar.filter((m) => m.gönderen_id === seçiliSohbetId || m.alıcı_id === seçiliSohbetId)
		: [];

	async function sohbetSeç(id) {
		seçiliSohbetId = id;
		yeniSohbetAçık = false;
		await tick();
		if (mesajListesiEl) mesajListesiEl.scrollTop = mesajListesiEl.scrollHeight;
	}

	async function mesajıGönder() {
		if (!yeniMetin.trim() || !seçiliSohbetId || gönderiliyor) return;
		gönderiliyor = true;
		errorMsg = '';
		try {
			const yeni = await mesajGönder($user.id, seçiliSohbetId, yeniMetin.trim());
			mesajlar = [...mesajlar, yeni];
			yeniMetin = '';
			await tick();
			if (mesajListesiEl) mesajListesiEl.scrollTop = mesajListesiEl.scrollHeight;
		} catch (e) {
			errorMsg = e.message;
		} finally {
			gönderiliyor = false;
		}
	}

	let yeniSohbetProfiller = [];
	async function yeniSohbetPaneliAç() {
		yeniSohbetAçık = !yeniSohbetAçık;
		if (yeniSohbetAçık && yeniSohbetProfiller.length === 0) {
			try {
				const tümProfiller = await getDiğerProfiller($user.id, 30);
				yeniSohbetProfiller = tümProfiller.filter((p) => !engellenenIdler.has(p.id));
				const eksikOlanlar = yeniSohbetProfiller.filter((p) => !profilMap[p.id]);
				for (const p of eksikOlanlar) profilMap[p.id] = p;
			} catch (e) {
				errorMsg = e.message;
			}
		}
	}

	async function kullanıcıyıEngelle(hedefId) {
		try {
			await engelle($user.id, hedefId);
			engellenenIdler = new Set([...engellenenIdler, hedefId]);
			if (seçiliSohbetId === hedefId) seçiliSohbetId = null;
		} catch (e) {
			errorMsg = e.message;
		}
	}

	async function engeliKaldır(hedefId) {
		try {
			await engelKaldır($user.id, hedefId);
			engellenenIdler = new Set([...engellenenIdler].filter((id) => id !== hedefId));
		} catch (e) {
			errorMsg = e.message;
		}
	}

	function şikayetModalınıAç(mesaj) {
		şikayetModalMesajı = mesaj;
		şikayetSebebi = '';
	}

	async function şikayetOnayla() {
		if (!şikayetModalMesajı || şikayetGönderiliyor) return;
		şikayetGönderiliyor = true;
		errorMsg = '';
		try {
			await şikayetGönder({
				şikayetEdenId: $user.id,
				şikayetEdilenId: şikayetModalMesajı.gönderen_id,
				mesajId: şikayetModalMesajı.id,
				mesajİçeriği: şikayetModalMesajı.içerik,
				sebep: şikayetSebebi
			});
			şikayetModalMesajı = null;
			şikayetTeşekkürGösteriliyor = true;
			setTimeout(() => (şikayetTeşekkürGösteriliyor = false), 4000);

			// admine bildirim gönder — bu başarısız olsa bile şikayet zaten kaydedildi, sessizce geç
			adminBildirGönder({
				şikayetEdenKullanıcıAdı: $user.email ?? $user.id,
				şikayetEdilenKullanıcıAdı: isim(şikayetModalMesajı.gönderen_id),
				mesajİçeriği: şikayetModalMesajı.içerik,
				sebep: şikayetSebebi
			});
		} catch (e) {
			errorMsg = e.message;
		} finally {
			şikayetGönderiliyor = false;
		}
	}

	async function adminBildirGönder(veri) {
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			await fetch('/api/sikayet-bildir', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session?.access_token}`
				},
				body: JSON.stringify(veri)
			});
		} catch {
			// admin bildirimi başarısız olsa bile kritik değil, şikayet zaten veritabanında
		}
	}

	async function eşleş() {
		if (!habit || eşleşmeDurumu === 'aranıyor') return;
		eşleşmeDurumu = 'aranıyor';
		errorMsg = '';
		try {
			const sonuç = await anonimEşleş(habit.alışkanlık_adı);
			if (!sonuç) {
				eşleşmeDurumu = 'bulunamadi';
				return;
			}
			profilMap[sonuç.matched_user_id] = { id: sonuç.matched_user_id, kullanici_adi: sonuç.matched_kullanici_adi };
			eşleşmeDurumu = 'basarili';
			await sohbetSeç(sonuç.matched_user_id);
			yeniMetin = 'Selam! Ben de aynı yoldayım, birlikte devam edelim 💪';
		} catch (e) {
			errorMsg = e.message;
			eşleşmeDurumu = '';
		}
	}

	function isim(id) {
		return profilMap[id]?.kullanici_adi ?? '…';
	}

	function baş(id) {
		return isim(id).slice(0, 1).toUpperCase();
	}

	function saatFormatla(tarih) {
		return new Date(tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>{$_('mesajlar.baslik')}</title>
</svelte:head>

{#if loading}
	<p class="muted">…</p>
{:else}
	<div class="mesajlar-layout">
		<aside class="sohbet-listesi-panel">
			<div class="panel-header">
				<h2 class="font-display">{$_('mesajlar.sohbetler')}</h2>
				<button class="icon-btn" title={$_('mesajlar.yeni_sohbet')} on:click={yeniSohbetPaneliAç}>+</button>
			</div>

			{#if habit}
				<button class="btn-eslesme" on:click={eşleş} disabled={eşleşmeDurumu === 'aranıyor'}>
					{$_('mesajlar.esles_buton')}
				</button>
				{#if eşleşmeDurumu === 'bulunamadi'}
					<p class="hint warn">{$_('mesajlar.esles_bulunamadi')}</p>
				{:else if eşleşmeDurumu === 'basarili'}
					<p class="hint ok">{$_('mesajlar.esles_basarili')}</p>
				{/if}
			{:else}
				<p class="hint">{$_('mesajlar.habit_yok')}</p>
			{/if}

			{#if yeniSohbetAçık}
				<div class="yeni-sohbet-list">
					{#each yeniSohbetProfiller as p (p.id)}
						<button class="sohbet-item" on:click={() => sohbetSeç(p.id)}>
							<span class="avatar">{p.kullanici_adi.slice(0, 1).toUpperCase()}</span>
							<span>{p.kullanici_adi}</span>
						</button>
					{/each}
				</div>
			{:else if sohbetListesi.length === 0}
				<p class="muted small">{$_('mesajlar.sohbet_yok')}</p>
			{:else}
				<div class="sohbet-list">
					{#each sohbetListesi as { id, sonMesaj } (id)}
						<button class="sohbet-item" class:active={seçiliSohbetId === id} on:click={() => sohbetSeç(id)}>
							<span class="avatar">{baş(id)}</span>
							<span class="sohbet-info">
								<span class="sohbet-isim">{isim(id)}</span>
								<span class="sohbet-onizleme">{sonMesaj.içerik}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}

			{#if engellenenIdler.size > 0}
				<button class="engellenenler-toggle" on:click={() => (engellenenlerAçık = !engellenenlerAçık)}>
					{$_('mesajlar.engellenenler')} ({engellenenIdler.size})
				</button>
				{#if engellenenlerAçık}
					<div class="engellenenler-list">
						{#each [...engellenenIdler] as id (id)}
							<div class="engellenen-item">
								<span>{isim(id)}</span>
								<button class="engel-kaldir-btn" on:click={() => engeliKaldır(id)}>
									{$_('mesajlar.engeli_kaldir')}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</aside>

		<section class="thread-panel">
			{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

			{#if !seçiliSohbetId}
				<div class="thread-empty">
					<p class="muted">{$_('mesajlar.sohbet_secilmedi')}</p>
				</div>
			{:else}
				<div class="thread-header">
					<span class="avatar">{baş(seçiliSohbetId)}</span>
					<span class="font-display thread-isim">{isim(seçiliSohbetId)}</span>
					<button class="btn-engelle" on:click={() => kullanıcıyıEngelle(seçiliSohbetId)}>
						{$_('mesajlar.engelle')}
					</button>
				</div>

				<div class="thread-messages" bind:this={mesajListesiEl}>
					{#each seçiliSohbetMesajları as m (m.id)}
						<div class="bubble-row" class:mine={m.gönderen_id === $user.id}>
							<div class="bubble">
								<p>{m.içerik}</p>
								<div class="bubble-alt">
									<span class="bubble-saat">{saatFormatla(m.tarih)}</span>
									{#if m.gönderen_id !== $user.id}
										<button class="bubble-sikayet" on:click={() => şikayetModalınıAç(m)}>
											{$_('mesajlar.sikayet_et')}
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<form class="thread-input" on:submit|preventDefault={mesajıGönder}>
					<input type="text" bind:value={yeniMetin} placeholder={$_('mesajlar.mesaj_placeholder')} />
					<button class="btn-primary" type="submit" disabled={!yeniMetin.trim() || gönderiliyor}>
						{$_('mesajlar.gonder')}
					</button>
				</form>
			{/if}
		</section>
	</div>
{/if}

{#if şikayetModalMesajı}
	<div class="modal-backdrop" on:click|self={() => (şikayetModalMesajı = null)}>
		<div
			class="modal"
			use:focusTrap
			on:escape={() => (şikayetModalMesajı = null)}
			role="dialog"
			aria-modal="true"
			aria-labelledby="sikayet-modal-baslik"
		>
			<h3 id="sikayet-modal-baslik" class="font-display">{$_('mesajlar.sikayet_baslik')}</h3>
			<p class="muted small">{$_('mesajlar.sikayet_aciklama')}</p>
			<blockquote class="sikayet-alinti">{şikayetModalMesajı.içerik}</blockquote>
			<textarea bind:value={şikayetSebebi} placeholder={$_('mesajlar.sikayet_sebep_placeholder')} rows="3"></textarea>
			<div class="modal-actions">
				<button class="btn-ghost" on:click={() => (şikayetModalMesajı = null)}>{$_('mesajlar.vazgec')}</button>
				<button class="btn-warn" on:click={şikayetOnayla} disabled={şikayetGönderiliyor}>
					{$_('mesajlar.sikayet_gonder')}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if şikayetTeşekkürGösteriliyor}
	<div class="sikayet-toast" role="status" aria-live="polite">{$_('mesajlar.sikayet_gonderildi')}</div>
{/if}

<style>
	.muted {
		color: var(--text-muted);
	}
	.small {
		font-size: 0.85rem;
	}
	.error {
		color: var(--warn);
		font-size: 0.85rem;
		padding: 0 16px;
	}
	.hint {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 8px 0 0;
	}
	.hint.warn {
		color: var(--warn);
	}
	.hint.ok {
		color: var(--accent);
	}

	.mesajlar-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 20px;
		height: 70vh;
		min-height: 480px;
	}

	.sohbet-listesi-panel {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 18px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.panel-header h2 {
		font-size: 1.05rem;
		font-weight: 500;
		margin: 0;
	}
	.icon-btn {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}

	.btn-eslesme {
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 10px;
		padding: 10px 14px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		margin-bottom: 6px;
	}
	.btn-eslesme:disabled {
		opacity: 0.6;
	}

	.sohbet-list,
	.yeni-sohbet-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 12px;
		overflow-y: auto;
	}
	.sohbet-item {
		display: flex;
		align-items: center;
		gap: 10px;
		border: none;
		background: transparent;
		border-radius: 10px;
		padding: 10px;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		color: var(--text);
	}
	.sohbet-item:hover,
	.sohbet-item.active {
		background: var(--accent-soft);
	}
	.avatar {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.9rem;
	}
	.sohbet-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.sohbet-isim {
		font-weight: 600;
		font-size: 0.88rem;
	}
	.sohbet-onizleme {
		font-size: 0.78rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.thread-panel {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.thread-empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.thread-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border);
		font-size: 1.05rem;
		font-weight: 500;
	}
	.thread-isim {
		flex: 1;
	}
	.btn-engelle {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text-muted);
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-engelle:hover {
		border-color: var(--warn);
		color: var(--warn);
	}

	.engellenenler-toggle {
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.78rem;
		text-align: left;
		cursor: pointer;
		padding: 10px 4px 4px;
		margin-top: auto;
	}
	.engellenenler-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 4px;
	}
	.engellenen-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8rem;
		gap: 8px;
	}
	.engel-kaldir-btn {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--accent);
		border-radius: 6px;
		padding: 4px 8px;
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.thread-messages {
		flex: 1;
		overflow-y: auto;
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.bubble-row {
		display: flex;
	}
	.bubble-row.mine {
		justify-content: flex-end;
	}
	.bubble {
		max-width: 70%;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 10px 14px;
	}
	.bubble-row.mine .bubble {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg-elevated);
	}
	.bubble p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
	}
	.bubble-alt {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}
	.bubble-saat {
		font-size: 0.68rem;
		opacity: 0.7;
	}
	.bubble-sikayet {
		border: none;
		background: transparent;
		color: inherit;
		opacity: 0.55;
		font-size: 0.68rem;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
	}
	.bubble-sikayet:hover {
		opacity: 1;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		z-index: 50;
	}
	.modal {
		background: var(--bg-elevated);
		border-radius: 16px;
		padding: 28px;
		max-width: 420px;
		width: 100%;
	}
	.modal h3 {
		margin: 0 0 8px;
		font-size: 1.2rem;
	}
	.sikayet-alinti {
		margin: 12px 0;
		padding: 10px 14px;
		border-left: 3px solid var(--border);
		background: var(--bg);
		font-size: 0.85rem;
		color: var(--text-muted);
		font-style: italic;
	}
	.modal textarea {
		width: 100%;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
		resize: vertical;
		margin-bottom: 14px;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
	.btn-ghost {
		border: 1px solid var(--border);
		background: transparent;
		color: var(--text);
		border-radius: 8px;
		padding: 10px 18px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-warn {
		border: none;
		background: var(--warn);
		color: white;
		border-radius: 8px;
		padding: 10px 18px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-warn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.sikayet-toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--accent);
		color: var(--bg-elevated);
		padding: 14px 24px;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 600;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
		z-index: 60;
	}

	.thread-input {
		display: flex;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid var(--border);
	}
	.thread-input input {
		flex: 1;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 10px 14px;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg);
		color: var(--text);
	}
	.btn-primary {
		border: none;
		background: var(--accent);
		color: var(--bg-elevated);
		border-radius: 999px;
		padding: 10px 20px;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: default;
	}

	@media (max-width: 720px) {
		.mesajlar-layout {
			grid-template-columns: 1fr;
			height: auto;
		}
		.sohbet-listesi-panel {
			max-height: 260px;
		}
		.thread-panel {
			height: 60vh;
		}
	}
</style>
