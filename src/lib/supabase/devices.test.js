import { describe, it, expect } from 'vitest';
import { cihazÇevrimİçiMi, cihazKalanSaniye } from './devices';

describe('cihazÇevrimİçiMi', () => {
	it('hiç görülmemiş (son_görülme null) bir cihaz için çevrimdışı döner', () => {
		expect(cihazÇevrimİçiMi({ son_görülme: null })).toBe(false);
	});

	it('son 15 saniye içinde görülen bir cihaz için çevrimiçi döner', () => {
		const beşSaniyeÖnce = new Date(Date.now() - 5000).toISOString();
		expect(cihazÇevrimİçiMi({ son_görülme: beşSaniyeÖnce })).toBe(true);
	});

	it('15 saniyeden daha eski bir cihaz için çevrimdışı döner', () => {
		const yirmiSaniyeÖnce = new Date(Date.now() - 20000).toISOString();
		expect(cihazÇevrimİçiMi({ son_görülme: yirmiSaniyeÖnce })).toBe(false);
	});
});

describe('cihazKalanSaniye', () => {
	it('fiş kapalıysa 0 döner', () => {
		expect(cihazKalanSaniye({ fiş_kapali: true, limit_dakika: 60, baslangic_zamani: new Date().toISOString() })).toBe(0);
	});

	it('limit_dakika ya da baslangic_zamani yoksa 0 döner', () => {
		expect(cihazKalanSaniye({ fiş_kapali: false, limit_dakika: null, baslangic_zamani: null })).toBe(0);
	});

	it('süre henüz dolmamışsa doğru kalan saniyeyi hesaplar', () => {
		const onDakikaÖnce = new Date(Date.now() - 10 * 60 * 1000).toISOString();
		const kalan = cihazKalanSaniye({ fiş_kapali: false, limit_dakika: 60, baslangic_zamani: onDakikaÖnce });
		// 60 dk limitten 10 dk geçmiş, ~50 dk (3000 sn) kalmalı — birkaç saniyelik tolerans bırakıyoruz
		expect(kalan).toBeGreaterThan(2990);
		expect(kalan).toBeLessThanOrEqual(3000);
	});

	it('süre dolmuşsa negatife düşmez, 0 döner', () => {
		const ikiSaatÖnce = new Date(Date.now() - 120 * 60 * 1000).toISOString();
		const kalan = cihazKalanSaniye({ fiş_kapali: false, limit_dakika: 60, baslangic_zamani: ikiSaatÖnce });
		expect(kalan).toBe(0);
	});
});
