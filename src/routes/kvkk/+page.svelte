<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>KVKK Aydınlatma Metni</title>
</svelte:head>

<div class="kvkk-page">
	<a href="/kayit" class="geri-link">← Kayıt sayfasına dön</a>

	<h1 class="font-display">KVKK Aydınlatma Metni</h1>
	<p class="not-metni">
		<strong>Not:</strong> Bu metin, "Ev Dön" projesinin bir yarışma/eğitim projesi olarak hazırlanmış taslak bir
		Kişisel Verilerin Korunması Kanunu (KVKK) aydınlatma metnidir. Gerçek kullanıcılarla canlıya alınacaksa, bir
		hukuk danışmanına gözden geçirtilmesi önerilir.
	</p>

	<h2>1. Veri Sorumlusu</h2>
	<p>
		"Ev Dön" web uygulamasının veri sorumlusu, projeyi geliştiren ekiptir. İletişim bilgileri için
		<a href="mailto:iletisim@example.com">iletisim@example.com</a> adresine yazabilirsiniz.
		<em>(Kendi gerçek e-posta adresinle değiştirmeyi unutma.)</em>
	</p>

	<h2>2. Toplanan Kişisel Veriler</h2>
	<ul>
		<li>Kimlik ve iletişim bilgileri: e-posta adresi, kullanıcı adı</li>
		<li>Alışkanlık takip verileri: alışkanlık adı, başlangıç tarihi, seri hedefi, nüks kayıtları</li>
		<li>Check-in verileri: ruh hali puanı, tetikleyici notları (kullanıcı tarafından girilmişse)</li>
		<li>Sosyal etkileşim verileri: gönderilen/alınan mesajlar, engelleme ve şikayet kayıtları</li>
		<li>Oyunlaştırma verileri: coin bakiyesi, sahip olunan eşyalar, rozetler</li>
		<li>Cihaz eşleştirme verileri: eşleştirilen akıllı priz cihazlarının adı, kategorisi ve durumu</li>
		<li>Teknik veriler: oturum/kimlik doğrulama bilgileri (Supabase Auth üzerinden)</li>
	</ul>

	<h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
	<ul>
		<li>Hesabınızın oluşturulması ve kimlik doğrulaması</li>
		<li>Alışkanlık takibi ve ilerleme istatistiklerinin (Gelişim Raporu) sunulması</li>
		<li>Oyunlaştırma özelliklerinin (ev, coin, rozet) çalıştırılması</li>
		<li>Diğer kullanıcılarla anonim eşleştirme ve mesajlaşma imkânı sağlanması</li>
		<li>Platform güvenliğinin sağlanması (engelleme, şikayet inceleme)</li>
		<li>Talep etmeniz hâlinde yapay zeka destekli özet/motivasyon üretilmesi</li>
	</ul>

	<h2>4. Kişisel Verilerin Aktarılması</h2>
	<p>
		Verileriniz, uygulamanın altyapı sağlayıcıları olan Supabase (veritabanı ve kimlik doğrulama) ve Cloudflare
		(barındırma ve yapay zeka işlemleri) ile paylaşılmaktadır. Bu sağlayıcılar, verileri yalnızca uygulamanın
		çalışması için gerekli teknik altyapıyı sağlamak amacıyla işler.
	</p>

	<h2>5. Toplama Yöntemi ve Hukuki Sebep</h2>
	<p>
		Verileriniz, web uygulaması üzerinden doğrudan sizin tarafınızdan girilmesi yoluyla, elektronik ortamda
		toplanır. İşleme, açık rızanız (KVKK m. 5/1) ve sözleşmenin kurulması/ifası (KVKK m. 5/2-c) hukuki sebeplerine
		dayanır.
	</p>

	<h2>6. Haklarınız (KVKK m. 11)</h2>
	<p>KVKK'nın 11. maddesi uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, işlenmesini gerektiren sebeplerin ortadan kalkması hâlinde silinmesini/yok edilmesini isteme ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme haklarına sahipsiniz.</p>
	<p>Bu haklarınızı kullanmak için yukarıdaki iletişim adresi üzerinden bize ulaşabilirsiniz.</p>
</div>

<style>
	.kvkk-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 40px 20px 80px;
	}
	.geri-link {
		display: inline-block;
		margin-bottom: 24px;
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
		font-size: 0.9rem;
	}
	h1 {
		font-size: 1.8rem;
		font-weight: 500;
		margin: 0 0 16px;
	}
	h2 {
		font-size: 1.15rem;
		font-weight: 600;
		margin: 32px 0 10px;
		color: var(--accent);
	}
	p,
	li {
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--text);
	}
	ul {
		padding-left: 20px;
	}
	.not-metni {
		background: var(--accent-soft);
		border-radius: 10px;
		padding: 14px 18px;
		font-size: 0.88rem;
	}
</style>
