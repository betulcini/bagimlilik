# Bağımlılık Web (proje kod adı)

## Kurulum

```bash
npm install
cp .env.example .env
# .env içine kendi Supabase proje URL ve anon key'ini gir
```

Supabase tarafında `supabase/schema.sql` dosyasını SQL Editor'de çalıştır — tüm tablolar ve RLS politikaları kurulur. Ardından `supabase/seed.sql` dosyasını da çalıştır — eşya mağazasındaki başlangıç eşyaları eklenir (bu olmadan ev sayfasındaki mağaza boş görünür). `supabase/functions.sql` dosyasını çalıştır — anonim eşleştirme özelliği için gereken veritabanı fonksiyonu kurulur.

**Yeni kurulum yapıyorsan** yukarıdakiler yeterli (davet sistemi zaten `schema.sql`'in içinde). **Daha önce `schema.sql`'i eski haliyle çalıştırdıysan**, ek olarak `supabase/referral-ve-bonus.sql` dosyasını da çalıştır — bu, mevcut tablolarına davet kodu / bonus coin desteği ekler ve önceden kayıt olmuş kullanıcılara geriye dönük davet kodu + coin satırı atar.

Son olarak `supabase/cihazlar.sql` dosyasını çalıştır — akıllı priz (ESP32) eşleştirme sistemi için gereken tablo ve fonksiyonlar kurulur.

```bash
npm run dev
```

## Klasör yapısı

```
src/
  app.css                 → tema (light/dark) CSS değişkenleri
  app.html
  lib/
    supabase/client.js    → Supabase client
    stores/theme.js       → aydınlık/karanlık tema store
    stores/user.js        → oturum durumu
    i18n/                 → svelte-i18n kurulumu + tr/en çeviri dosyaları
    components/
      layout/             → header, nav, footer gibi ortak bileşenler
      dashboard/           → sayaç, check-in, nüks butonu bileşenleri
      ev/                  → izometrik oda, eşya mağazası bileşenleri
      ui/                  → buton, kart gibi genel bileşenler
  routes/
    +layout.svelte         → i18n + tema wiring (tüm site için)
    +page.svelte           → landing sayfası
    (auth)/giris/          → giriş sayfası (henüz giriş gerektirmez)
    (auth)/kayit/          → kayıt sayfası
    (app)/+layout.svelte   → oturum kontrolü (giriş yapılmadıysa /giris'e yönlendirir)
    (app)/dashboard/       → temiz gün sayacı, check-in, nüks
    (app)/ev/              → kullanıcının kendi evi
    (app)/kesif/           → diğer kullanıcıların evleri + eşya galerisi
    (app)/mesajlar/        → motivasyon mesajları
supabase/
  schema.sql               → tüm tablo tanımları + RLS politikaları
firmware/
  esp32-akilli-priz/       → cihaz elindeyken ESP32'ye yükleyeceğin örnek Arduino kodu
```

## Cloudflare'e deploy etme

Cloudflare artık siteleri "Pages" yerine "Workers" akışından deploy ediyor (panelde ayrı bir "Pages" sekmesi yok). Adımlar:

1. Cloudflare panelinde **Workers & Pages > Create application**'a gir.
2. **"Import a repository"** (ya da "Connect to Git") seçeneğini bul, GitHub hesabını bağla, `bagimlilik` reposunu seç. **"Create Worker" / "Hello World" gibi şablonlara tıklama** — mutlaka repo import akışını kullan.
3. Build ayarlarında:
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy` (bu otomatik gelmiş olabilir, doğruysa dokunma)
4. **Environment variables** kısmına `PUBLIC_SUPABASE_URL` ve `PUBLIC_SUPABASE_ANON_KEY`'i ekle.
5. **Save and Deploy**.

Bu proje artık `@sveltejs/adapter-cloudflare` ve `wrangler.jsonc` ile Cloudflare Workers'a uygun şekilde yapılandırılmış durumda — `npm run build` çalıştığında Cloudflare'in beklediği formatta bir worker üretiyor.

## Sıradaki adımlar (birlikte kodlanacak)
1. Landing sayfası
2. Kayıt / giriş sayfaları
3. Dashboard (sayaç + check-in + nüks butonu)
4. Ev görünümü (CSS grid izometrik oda + eşya mağazası)
5. Keşif/galeri sayfası
6. Mesajlaşma sayfası
