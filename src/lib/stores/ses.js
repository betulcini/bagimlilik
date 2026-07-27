import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createSesStore() {
	const initial = browser ? localStorage.getItem('sesEtkin') !== 'false' : true;
	const { subscribe, set, update } = writable(initial);

	function applyAndSet(value) {
		if (browser) localStorage.setItem('sesEtkin', String(value));
		set(value);
	}

	return {
		subscribe,
		set: applyAndSet,
		toggle() {
			update((current) => {
				const next = !current;
				applyAndSet(next);
				return next;
			});
		},
		init() {
			if (browser) {
				set(localStorage.getItem('sesEtkin') !== 'false');
			}
		}
	};
}

export const sesEtkin = createSesStore();
