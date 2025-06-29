const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.transformer.unstable_allowRequireContext = true;
config.resolver.sourceExts.push('css');

// Optimize Metro bundler
config.maxWorkers = 4;
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
  },
};

// Configure proper cache store
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules/.cache/metro') })
];

module.exports = config;