// Phase 3 of the Electron flatten pipeline.
//
// Phases 1+2 (in build-electron.sh) hoist a single version of each package to
// top-level node_modules/. When a top-level package needs a *different* major
// of a transitive dep than the hoisted one (e.g. parse5@8 needs entities@8,
// but hoisted entities is @6 from another path), Node's resolver walks
// node_modules upward and finds the wrong version.
//
// For every top-level package, copy its specific siblings from
// .pnpm/{name}@{ver}/node_modules/ into {pkg}/node_modules/ — but skip
// siblings where the top-level version already matches, to avoid duplicating
// hundreds of MB.

const fs = require('fs')
const path = require('path')

const pnpmDir = 'dist-nextjs/node_modules/.pnpm'
const topLevel = 'dist-nextjs/node_modules'

const readVersion = pkgDir => {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}

const pnpmEntries = fs.readdirSync(pnpmDir)

// pnpm replaces '/' with '+' in directory names (filesystem paths cannot contain slashes).
const findPnpmEntry = (name, version) => {
  const prefix = name.replace(/\//g, '+') + '@' + version

  return pnpmEntries.find(e => e === prefix || e.startsWith(prefix + '_')) || null
}

const enumeratePackages = dir => {
  const out = []

  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue
    const entryPath = path.join(dir, entry)

    if (entry.startsWith('@')) {
      if (!fs.statSync(entryPath).isDirectory()) continue
      for (const inner of fs.readdirSync(entryPath)) {
        out.push({ name: entry + '/' + inner, dir: path.join(entryPath, inner) })
      }
    } else {
      out.push({ name: entry, dir: entryPath })
    }
  }
  return out
}

const copyPackage = (src, dest) => {
  if (fs.existsSync(dest)) return false
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(src, dest, { recursive: true, dereference: true })
  return true
}

let nested = 0

for (const { name, dir } of enumeratePackages(topLevel)) {
  const version = readVersion(dir)

  if (!version) continue
  const entry = findPnpmEntry(name, version)

  if (!entry) continue

  const sibsDir = path.join(pnpmDir, entry, 'node_modules')

  if (!fs.existsSync(sibsDir)) continue

  for (const { name: sibName, dir: sibSrc } of enumeratePackages(sibsDir)) {
    if (sibName === name) continue
    const sibVersion = readVersion(sibSrc)
    const topVersion = readVersion(path.join(topLevel, sibName))

    if (topVersion && topVersion === sibVersion) continue
    const dest = path.join(dir, 'node_modules', sibName)

    if (copyPackage(sibSrc, dest)) nested++
  }
}

console.log(`         Nested ${nested} version-pinned deps`)
