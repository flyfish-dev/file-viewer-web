#!/usr/bin/env node
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptFile = fileURLToPath(import.meta.url)
const packageDir = resolve(dirname(scriptFile), '..')
const sourceDir = resolve(packageDir, 'viewer')
const isPostinstall = process.argv.includes('--postinstall')
const explicitTarget = process.argv.slice(2).find(arg => !arg.startsWith('--'))
const targetDir = resolve(
  process.env.FILE_VIEWER_PUBLIC_DIR ||
  explicitTarget ||
  resolve(process.env.INIT_CWD || process.cwd(), 'public/file-viewer')
)

const skip = process.env.FILE_VIEWER_SKIP_ASSET_COPY === '1' ||
  process.env.FILE_VIEWER_SKIP_ASSET_COPY === 'true'

if (skip) {
  process.exit(0)
}

// Workspace installs should not mutate the repository automatically.
if (isPostinstall && !packageDir.includes('node_modules')) {
  process.exit(0)
}

if (!existsSync(sourceDir)) {
  const message = `[file-viewer-web] Missing viewer asset output: ${sourceDir}`
  if (isPostinstall) {
    console.warn(message)
    process.exit(0)
  }
  console.error(message)
  process.exit(1)
}

const removeMacMetadata = async dir => {
  const entries = await readdir(dir, { withFileTypes: true })
  await Promise.all(entries.map(entry => {
    const path = resolve(dir, entry.name)
    if (entry.name === '.DS_Store') {
      return rm(path, { force: true })
    }
    if (entry.isDirectory()) {
      return removeMacMetadata(path)
    }
    return undefined
  }))
}

const copyWithBuiltHelper = async () => {
  const helperPath = resolve(packageDir, 'dist/node.js')
  if (!existsSync(helperPath)) {
    return false
  }

  const { copyViewerAssets } = await import(pathToFileURL(helperPath).href)
  const result = await copyViewerAssets({ sourceDir, targetDir })
  if (result.validation?.missingOptional?.length) {
    console.warn(
      `[file-viewer-web] optional viewer assets missing: ${
        result.validation.missingOptional.map(asset => asset.relativePath).join(', ')
      }`
    )
  }
  console.log(`[file-viewer-web] viewer assets copied to ${result.targetDir}`)
  console.log(`[file-viewer-web] viewer asset manifest written to ${result.assetManifestPath}`)
  return true
}

const copyWithFallback = async () => {
  await rm(targetDir, { force: true, recursive: true })
  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true })
  await removeMacMetadata(targetDir)
  console.log(`[file-viewer-web] viewer assets copied to ${targetDir}`)
}

try {
  if (!await copyWithBuiltHelper()) {
    await copyWithFallback()
  }
} catch (reason) {
  const message = reason instanceof Error ? reason.message : String(reason)
  if (isPostinstall) {
    console.warn(`[file-viewer-web] viewer asset copy skipped: ${message}`)
    process.exit(0)
  }
  console.error(`[file-viewer-web] viewer asset copy failed: ${message}`)
  process.exit(1)
}
