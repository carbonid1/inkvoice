// electron-builder afterPack hook
// Copies node_modules into the packaged Next.js standalone directory
// (electron-builder strips node_modules from extraResources by default)

const fs = require('fs')
const path = require('path')

module.exports = async function (context) {
  const resourcesDir = path.join(context.appOutDir, 'InkVoice.app', 'Contents', 'Resources')
  const nextjsDir = path.join(resourcesDir, 'nextjs')

  // Copy node_modules from staging to the packaged app
  const src = path.join(process.cwd(), 'dist-nextjs', 'node_modules')
  const dest = path.join(nextjsDir, 'node_modules')

  if (!fs.existsSync(src)) {
    console.error('[afterPack] dist-nextjs/node_modules not found!')
    process.exit(1)
  }

  console.log(`[afterPack] Copying node_modules to ${dest}...`)
  fs.cpSync(src, dest, { recursive: true })
  console.log('[afterPack] node_modules copied.')
}
