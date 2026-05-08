const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Forzar que Zustand use los archivos CJS en vez de los ESM
// Los archivos ESM de Zustand contienen "import.meta" que no es compatible con Metro/Web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'zustand') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/index.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/middleware') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/vanilla') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/shallow') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
