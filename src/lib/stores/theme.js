import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
	const initial = browser ? localStorage.getItem('tema') ?? 'light' : 'light';
	const { subscribe, set, update } = writable(initial);

	function applyAndSet(value) {
		if (browser) {
			localStorage.setItem('tema', value);
			document.documentElement.setAttribute('data-theme', value);
		}
		set(value);
	}

	return {
		subscribe,
		set: applyAndSet,
		toggle() {
			update((current) => {
				const next = current === 'light' ? 'dark' : 'light';
				applyAndSet(next);
				return next;
			});
		},
		init() {
			if (browser) {
				const stored = localStorage.getItem('tema') ?? 'light';
				document.documentElement.setAttribute('data-theme', stored);
				set(stored);
			}
		}
	};
}

export const theme = createThemeStore();
