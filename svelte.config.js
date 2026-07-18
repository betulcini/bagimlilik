import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// route groups: (auth) = giriş gerektirmeyen sayfalar, (app) = giriş sonrası korumalı sayfalar
		alias: {
			$stores: 'src/lib/stores',
			$components: 'src/lib/components'
		}
	}
};

export default config;
