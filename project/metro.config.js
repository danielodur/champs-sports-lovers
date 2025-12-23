const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.transformer.unstable_allowRequireContext = true;
config.resolver.sourceExts.push("css");

// Add Lottie animation file support
config.resolver.assetExts.push("json", "lottie");

// Configure path aliases
config.resolver.alias = {
  "@": path.resolve(__dirname),
};

// Ensure proper platform extensions resolution
config.resolver.platforms = ["ios", "android", "native", "web"];

// Configure transformer for Lottie files
config.transformer = {
  ...config.transformer,
  assetPlugins: ["expo-asset/tools/hashAssetFiles"],
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Optimize Metro bundler
config.maxWorkers = 4;
config.transformer.minifierConfig = {
  compress: {
    drop_console: false, // Keep console logs for debugging env vars
    drop_debugger: true,
  },
};

// Configure proper cache store
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, "node_modules/.cache/metro") }),
];

// Enable watchman for better file watching
config.watchFolders = [
  path.resolve(__dirname, "assets"),
  path.resolve(__dirname, "components"),
  path.resolve(__dirname, "services"),
];

module.exports = config;
