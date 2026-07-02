/**
 * 🧹 LIMPEZA SEGURA DE CACHE — Windows + Unix
 *
 * Remove diretórios de cache sem quebrar com EPERM.
 * Usa retry com delay para arquivos travados pelo sistema.
 *
 * Uso:
 *   npm run clean:cache   (limpa .next + cache)
 *   npm run reset          (limpa + regenera Prisma)
 */

const fs = require('fs')
const path = require('path')

const dirsToClean = ['.next', 'node_modules/.cache', '.turbo']

function sleep(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) { /* spin */ }
}

function rmDir(dirPath, retries = 3) {
  const fullPath = path.resolve(dirPath)

  if (!fs.existsSync(fullPath)) {
    console.log(`  ⏭  ${dirPath} (não existe)`)
    return true
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true })
      console.log(`  ✓  ${dirPath} removido`)
      return true
    } catch (e) {
      if (attempt < retries) {
        console.log(`  ⚠  ${dirPath} travado, tentando novamente (${attempt}/${retries})...`)
        sleep(1000)
      } else {
        console.log(`  ✗  ${dirPath}: ${e.message.slice(0, 80)}`)
        return false
      }
    }
  }
  return false
}

console.log('🧹 Limpando cache...\n')
for (const dir of dirsToClean) {
  rmDir(dir)
}
console.log('\n✅ Limpeza concluída.')
