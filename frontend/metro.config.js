const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Asegurar que los archivos .env se incluyan en el paquete
config.resolver.assetExts.push('env');

module.exports = config;
