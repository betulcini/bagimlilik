import { describe, it, expect } from 'vitest';
import { cihazÇevrimİçiMi } from './devices';

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
