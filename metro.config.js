const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve SQLite's bundled wasm on web.
config.resolver.assetExts.push('wasm');

module.exports = config;
