import { describe, it, expect } from 'vitest';
import { parsePgIntervalToSeconds } from './habits';

describe('parsePgIntervalToSeconds', () => {
	it('boş/null değer için 0 döner', () => {
		expect(parsePgIntervalToSeconds(null)).toBe(0);
		expect(parsePgIntervalToSeconds(undefined)).toBe(0);
		expect(parsePgIntervalToSeconds('')).toBe(0);
	});

	it('sayısal değeri olduğu gibi döner', () => {
		expect(parsePgIntervalToSeconds(120)).toBe(120);
	});

	it('kendi yazdığımız "X seconds" formatını doğru çözer', () => {
		expect(parsePgIntervalToSeconds('90 seconds')).toBe(90);
		expect(parsePgIntervalToSeconds('1 second')).toBe(1);
		expect(parsePgIntervalToSeconds('3600 seconds')).toBe(3600);
	});

	it('ondalıklı saniyeyi aşağı yuvarlar', () => {
		expect(parsePgIntervalToSeconds('90.7 seconds')).toBe(90);
	});

	it('Postgres\'in "X days HH:MM:SS" formatını doğru çözer', () => {
		expect(parsePgIntervalToSeconds('3 days 02:15:00')).toBe(3 * 86400 + 2 * 3600 + 15 * 60);
	});

	it('sadece gün içeren interval\'ı doğru çözer', () => {
		expect(parsePgIntervalToSeconds('7 days')).toBe(7 * 86400);
	});

	it('tek gün için tekil "day" biçimini de anlar', () => {
		expect(parsePgIntervalToSeconds('1 day 00:00:00')).toBe(86400);
	});

	it('sadece saat:dakika:saniye içeren interval\'ı doğru çözer (0 gün)', () => {
		expect(parsePgIntervalToSeconds('05:30:15')).toBe(5 * 3600 + 30 * 60 + 15);
	});
});
