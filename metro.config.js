/**
 * Configuração do Metro Bundler para React Native
 * Inclui configurações para suporte a módulos .cjs e .mjs
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte para arquivos .cjs (CommonJS)
config.resolver.assetExts.push('cjs');

// Configura extensões de arquivo fonte
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',  // Módulos JavaScript
  'cjs'   // CommonJS
];

module.exports = config;