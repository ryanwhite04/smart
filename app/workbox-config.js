module.exports = {
	globDirectory: 'public/',
	globPatterns: [
	  '**/*.{html,js,css}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
	  /^utm_/,
	  /^fbclid$/
	],
	runtimeCaching: [
	  {
		urlPattern: /^https:\/\/esm\.sh\//,
		handler: 'StaleWhileRevalidate',
		options: {
		  cacheName: 'esm-sh-cache',
		  expiration: {
			maxEntries: 20,
			maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
		  },
		  cacheableResponse: {
			statuses: [0, 200],
		  },
		},
	  },
	  {
		urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
		handler: 'StaleWhileRevalidate',
		options: {
		  cacheName: 'google-fonts-stylesheets',
		},
	  },
	  {
		urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
		handler: 'CacheFirst',
		options: {
		  cacheName: 'google-fonts-webfonts',
		  expiration: {
			maxEntries: 30,
			maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
		  },
		  cacheableResponse: {
			statuses: [0, 200],
		  },
		},
	  },
	],
  };