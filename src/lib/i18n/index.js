import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';

register('tr', () => import('./locales/tr.json'));
register('en', () => import('./locales/en.json'));

const stored = browser ? localStorage.getItem('dil') : null;

init({
	fallbackLocale: 'tr',
	initialLocale: stored ?? (browser ? getLocaleFromNavigator() : 'tr')
});
