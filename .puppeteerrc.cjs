/**
 * Puppeteer config para produção
 *
 * Em produção (Linux VPS), usa o Chromium instalado no sistema.
 * Em desenvolvimento (Windows), usa o Chromium baixado pelo Puppeteer.
 */

const { join } = require('path')

const isLinux = process.platform === 'linux'

module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),

  // Em produção: usa chromium-browser do sistema
  // Em dev: o Puppeteer baixa o Chromium automaticamente
  ...(isLinux && { executablePath: '/usr/bin/chromium-browser' }),
}
