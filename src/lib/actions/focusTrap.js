/**
 * Bir modal/dialog içinde Tab tuşuyla odağı hapseder (dışına kaçmasını engeller),
 * Escape'e basılınca 'escape' event'i fırlatır, modal kapanınca odağı önceki
 * elemana geri verir. Kullanımı: <div use:focusTrap on:escape={...}>
 */
export function focusTrap(node) {
	const odaklanabilirSeçici =
		'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

	function tuşaBasıldı(e) {
		if (e.key === 'Escape') {
			node.dispatchEvent(new CustomEvent('escape'));
			return;
		}
		if (e.key !== 'Tab') return;

		const odaklanabilirler = node.querySelectorAll(odaklanabilirSeçici);
		if (odaklanabilirler.length === 0) return;
		const ilk = odaklanabilirler[0];
		const son = odaklanabilirler[odaklanabilirler.length - 1];

		if (e.shiftKey && document.activeElement === ilk) {
			e.preventDefault();
			son.focus();
		} else if (!e.shiftKey && document.activeElement === son) {
			e.preventDefault();
			ilk.focus();
		}
	}

	const öncekiOdak = document.activeElement;
	node.addEventListener('keydown', tuşaBasıldı);

	const odaklanabilirler = node.querySelectorAll(odaklanabilirSeçici);
	if (odaklanabilirler.length > 0) odaklanabilirler[0].focus();

	return {
		destroy() {
			node.removeEventListener('keydown', tuşaBasıldı);
			if (öncekiOdak && typeof öncekiOdak.focus === 'function') öncekiOdak.focus();
		}
	};
}
