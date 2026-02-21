const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve Node.js built-in modules that axios tries to import
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub out Node.js built-ins that don't exist in React Native
  const nodeBuiltins = ['crypto', 'http', 'https', 'url', 'zlib', 'stream', 'assert', 'tty', 'util', 'os', 'events', 'net', 'fs', 'path'];
  if (nodeBuiltins.includes(moduleName)) {
    return {
      type: 'empty',
    };
  }
  if (moduleName === 'proxy-from-env' || moduleName === 'form-data' || moduleName === 'follow-redirects') {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
