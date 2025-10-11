// metro.config.js
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
	const config = await getDefaultConfig(__dirname);
	return config;
})();
