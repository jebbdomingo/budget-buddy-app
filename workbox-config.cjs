module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{css,js,woff2,eot,svg,ttf,woff,ico,png,html,jpg,txt}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
    navigateFallback: null
};