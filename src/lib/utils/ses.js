import { get } from 'svelte/store';
import { sesEtkin } from '$stores/ses';

/** Verilen metni tarayıcının kendi sesli okuma (TTS) özelliğiyle okur. */
export function sesliOku(metin, dilKodu = 'tr-TR') {
	if (!get(sesEtkin)) return;
	if (typeof window === 'undefined' || !window.speechSynthesis) return;

	try {
		window.speechSynthesis.cancel(); // önceki cümle bitmediyse kes, yenisini başlat
		const konuşma = new SpeechSynthesisUtterance(metin);
		konuşma.lang = dilKodu;
		konuşma.rate = 0.95;
		window.speechSynthesis.speak(konuşma);
	} catch {
		// tarayıcı desteklemiyorsa sessizce geç
	}
}

/** Devam eden bir sesli okumayı hemen keser (ses kapalıyken de çalışır — durdurma her zaman serbest olmalı). */
export function sesiDurdur() {
	if (typeof window !== 'undefined' && window.speechSynthesis) {
		try {
			window.speechSynthesis.cancel();
		} catch {
			// yoksay
		}
	}
}

let ambiyansNodes = null;

/** Sakin, düşük sesli bir akor çalmaya başlar (nefes egzersizi gibi uzun süreli oturumlar için arka plan). */
export function ambiyansBaşlat() {
	if (!get(sesEtkin)) return;
	if (typeof window === 'undefined' || ambiyansNodes) return;

	try {
		const ctx = getAudioCtx();
		const masterGain = ctx.createGain();
		masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
		masterGain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 2.5); // yumuşak giriş
		masterGain.connect(ctx.destination);

		const frekanslar = [130.81, 196.0, 261.63]; // C3–G3–C4, sakin bir akor
		const osciller = frekanslar.map((freq) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.value = freq;
			osc.connect(masterGain);
			osc.start();
			return osc;
		});

		ambiyansNodes = { osciller, masterGain, ctx };
	} catch {
		ambiyansNodes = null;
	}
}

/** Ambiyansı yumuşakça (aniden kesmeden) durdurur. */
export function ambiyansDurdur() {
	if (!ambiyansNodes) return;
	const { osciller, masterGain, ctx } = ambiyansNodes;
	try {
		const şimdi = ctx.currentTime;
		masterGain.gain.cancelScheduledValues(şimdi);
		masterGain.gain.setValueAtTime(masterGain.gain.value, şimdi);
		masterGain.gain.linearRampToValueAtTime(0.0001, şimdi + 1); // yumuşak çıkış
		setTimeout(() => {
			osciller.forEach((o) => {
				try {
					o.stop();
				} catch {
					// zaten durmuş olabilir
				}
			});
		}, 1100);
	} catch {
		// yoksay
	}
	ambiyansNodes = null;
}

let audioCtx;
function getAudioCtx() {
	if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	return audioCtx;
}

/**
 * Hiçbir ses dosyasına ihtiyaç duymadan, doğrudan tarayıcıda basit bir
 * ton/akor üretir (Web Audio API). tür: 'basari' | 'bildirim'
 */
export function basitSesÇal(tür = 'basari') {
	if (!get(sesEtkin)) return;
	if (typeof window === 'undefined') return;

	try {
		const ctx = getAudioCtx();
		const şimdi = ctx.currentTime;

		if (tür === 'tik') {
			// çok kısa, kısık bir tıklama sesi — her buton tıklamasında çalması için
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.frequency.value = 900;
			osc.type = 'sine';
			gain.gain.setValueAtTime(0.0001, şimdi);
			gain.gain.exponentialRampToValueAtTime(0.06, şimdi + 0.005);
			gain.gain.exponentialRampToValueAtTime(0.0001, şimdi + 0.05);
			osc.connect(gain).connect(ctx.destination);
			osc.start(şimdi);
			osc.stop(şimdi + 0.06);
			return;
		}

		const notalar = tür === 'basari' ? [523.25, 659.25, 783.99] : [660];

		notalar.forEach((frekans, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.frequency.value = frekans;
			osc.type = 'sine';
			gain.gain.setValueAtTime(0.0001, şimdi + i * 0.12);
			gain.gain.exponentialRampToValueAtTime(0.18, şimdi + i * 0.12 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, şimdi + i * 0.12 + 0.3);
			osc.connect(gain).connect(ctx.destination);
			osc.start(şimdi + i * 0.12);
			osc.stop(şimdi + i * 0.12 + 0.35);
		});
	} catch {
		// Web Audio API desteklenmiyorsa sessizce geç
	}
}
