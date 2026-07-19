/*
  ESP32 Akıllı Priz — Örnek Firmware
  ===================================

  Ne yapar:
  - WiFi'ye bağlanır
  - Her birkaç saniyede bir Supabase'deki cihaz_durumu_oku() fonksiyonunu
    çağırıp "fişi kapatmam gerekiyor mu?" diye sorar
  - Cevaba göre röleyi (relay) açar/kapatır

  Gerekli donanım:
  - ESP32 geliştirme kartı
  - Bir röle modülü (priz hattını kesmek için) — 5V/3.3V tetiklemeli, NORMALDE KAPALI (NO) bacağına
    priz hattı bağlanır. RÖLE VE 220V HAT İLE ÇALIŞIRKEN DİKKATLİ OL, gerekirse bir yetişkinden/
    öğretmeninden yardım al — elektrik hattına doğrudan müdahale tehlikeli olabilir.
  - ESP32'nin bir GPIO pini röleye bağlı (aşağıda RELAY_PIN)

  Doldurman gereken alanlar aşağıda "// >>> BURAYI DOLDUR" yazan yerler:
  - WIFI_SSID / WIFI_PASSWORD
  - SUPABASE_URL / SUPABASE_ANON_KEY (proje ayarlarındaki .env dosyandan alabilirsin)
  - CIHAZ_KODU (Cihazlarım sayfasında cihazı eklediğinde üretilen kod, "Kopyala" ile al)

  Kütüphaneler (Arduino IDE > Library Manager'dan kur):
  - WiFi (ESP32 board paketiyle otomatik gelir)
  - HTTPClient (ESP32 board paketiyle otomatik gelir)
*/

#include <WiFi.h>
#include <HTTPClient.h>

// >>> BURAYI DOLDUR
const char* WIFI_SSID     = "WIFI_ADIN";
const char* WIFI_PASSWORD = "WIFI_SIFREN";

// >>> BURAYI DOLDUR (Supabase Settings > API sayfasından)
const char* SUPABASE_URL      = "https://xxxxxxxx.supabase.co";
const char* SUPABASE_ANON_KEY = "sb_publishable_xxxxxxxx";

// >>> BURAYI DOLDUR (sitedeki Cihazlarım sayfasından kopyaladığın kod)
const char* CIHAZ_KODU = "xxxxxxxxxxxxxxxxxxxx";

const int RELAY_PIN = 26;           // röleyi bağladığın GPIO pini
const bool RELAY_ACTIVE_HIGH = true; // röle modülün HIGH sinyalde mi açılıyor? (çoğu modül LOW'da açılır, denemen gerekebilir)

const unsigned long SORGU_ARALIGI_MS = 5000; // her 5 saniyede bir sor

void wifiyeBaglan() {
	Serial.print("WiFi'ye baglaniliyor");
	WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
	while (WiFi.status() != WL_CONNECTED) {
		delay(400);
		Serial.print(".");
	}
	Serial.println("\nBaglandi! IP: " + WiFi.localIP().toString());
}

void roleyiAyarla(bool fisKapali) {
	// fisKapali true ise röleyi "kapat" (elektriği kes) konumuna al
	bool acikMi = !fisKapali;
	bool pinDegeri = RELAY_ACTIVE_HIGH ? acikMi : !acikMi;
	digitalWrite(RELAY_PIN, pinDegeri ? HIGH : LOW);
}

bool sunucudanDurumSor() {
	HTTPClient http;
	String url = String(SUPABASE_URL) + "/rest/v1/rpc/cihaz_durumu_oku";

	http.begin(url);
	http.addHeader("Content-Type", "application/json");
	http.addHeader("apikey", SUPABASE_ANON_KEY);
	http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

	String gövde = String("{\"p_kod\":\"") + CIHAZ_KODU + "\"}";
	int kod = http.POST(gövde);

	bool fisKapaliMi = false;
	if (kod == 200) {
		String cevap = http.getString(); // "true" ya da "false" döner
		fisKapaliMi = cevap.indexOf("true") >= 0;
	} else {
		Serial.println("Sunucu hatasi: " + String(kod));
	}

	http.end();
	return fisKapaliMi;
}

void setup() {
	Serial.begin(115200);
	pinMode(RELAY_PIN, OUTPUT);
	roleyiAyarla(false); // başlangıçta fiş açık

	wifiyeBaglan();
}

void loop() {
	if (WiFi.status() != WL_CONNECTED) {
		wifiyeBaglan();
	}

	bool fisKapali = sunucudanDurumSor();
	roleyiAyarla(fisKapali);

	Serial.println(fisKapali ? "Durum: FIS KAPALI" : "Durum: FIS ACIK");

	delay(SORGU_ARALIGI_MS);
}
