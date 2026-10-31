import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { retainedBundleLicense } from "./bundle-notices.mjs"
import { declaredSpdxNotice } from "./declared-spdx-notices.mjs"
import { correspondingSourceNotice } from "./corresponding-source-notices.mjs"

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const workspace = resolve(import.meta.dirname, 'workspace-inputs')

/** Private evidence from physical bundler inputs; never publish maintenance paths. */
export async function writeBundleInventory(inputs, output, { base = process.cwd(), extraInputs = [] } = {}) {
  const packages = new Map()
  const files = []
  const virtualInputs = []
  for (const input of [...new Set([...inputs, ...extraInputs])].sort()) {
    if (input.startsWith('\0') || input.startsWith('<') || input.startsWith('(disabled):') || /^[a-z-]+:/.test(input)) {
      virtualInputs.push(input)
      continue
    }
    const logical = (isAbsolute(input) ? input : resolve(base, input)).split('?')[0]
    const path = await realpath(logical)
    const bytes = await readFile(path)
    let directory = dirname(path)
    let owner
    while (dirname(directory) !== directory) {
      try {
        const metadataBytes = await readFile(join(directory, 'package.json'))
        const metadata = JSON.parse(metadataBytes)
        if (metadata.name && metadata.version) {
          const id = `${metadata.name}@${metadata.version}`
          owner = id
          if (!packages.has(id)) {
            const licenseFiles = {}
            const legalNames = (await readdir(directory, { withFileTypes: true }))
              .filter(entry => entry.isFile() && /(?:^|[._-])(?:licen[cs]es?|copying|notices?)(?:[._-]|$)/i.test(entry.name))
              .map(entry => entry.name).sort()
            for (const name of legalNames) {
              const legal = await readFile(join(directory, name))
              licenseFiles[name] = { bytes: legal.length, sha256: hash(legal) }
            }
            packages.set(id, {
              name: metadata.name, version: metadata.version,
              declaredLicense: typeof metadata.license === 'string' ? metadata.license : metadata.license?.type || null,
              repository: metadata.repository?.url || metadata.repository || null,
              directory: relative(workspace, directory).replaceAll('\\', '/'),
              packageJsonSha256: hash(metadataBytes), licenseFiles,
              correspondingSource: await correspondingSourceNotice(metadata).then(value => value && { ...value, text: undefined, textSha256: hash(value.text) }),
              declaredSpdxNotice: await declaredSpdxNotice(metadata, { directory }).then(value => value && { ...value, text: undefined, textSha256: hash(value.text) }),
              retainedLicense: await retainedBundleLicense(metadata).then(value => value && ({ sha256: value.sha256, source: value.source, selectedLicense: value.selectedLicense, correspondingSource: value.correspondingSource, notice: value.notice && { sha256: value.notice.sha256, source: value.notice.source } })),
            })
          }
          break
        }
      } catch (error) { if (error.code !== 'ENOENT') throw error }
      directory = dirname(directory)
    }
    if (!owner) throw new Error(`Physical bundled input lacks an owning package: ${input}`)
    files.push({ path: relative(workspace, path).replaceAll('\\', '/'), owner, bytes: bytes.length, sha256: hash(bytes) })
  }
  const receipt = {
    schemaVersion: 1, purpose: 'private-actual-bundle-input-evidence',
    sourceLockSha256: "086958bf2d4269dbd3e7121eabc95287e41b68414b6daf43b3685dbd3aea2921",
    packages: [...packages.values()].sort((a,b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)), files, virtualInputs,
  }
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 })
  return receipt
}
