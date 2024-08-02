module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{css,js,woff2,eot,svg,ttf,woff,ico,png,html,jpg,txt}',
        '/index.html'
	],
	swDest: 'dist/assets/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
    navigateFallback: '/index.html'
};