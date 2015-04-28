Package.describe({
	name: 'doedel:famous-flex',
	summary: 'Animatable layouts, FlexScrollView & widgets for famo.us.',
	version: "0.3.1",
	git: 'https://github.com/udiedrichsen/meteor-famous-flex'
});

var server = 'server';
var client = 'client';
var both = [client, server];

Package.onUse(function (api) {
	api.add_files('lib/famous-flex-globals.js', client);
	api.export('famousflex');
});

Package.onTest(function (api) {
});
