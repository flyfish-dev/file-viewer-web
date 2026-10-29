import { createRequire as nativeRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const rootRequire = nativeRequire(new URL('../../package.json', import.meta.url))
export function createRequire(path) {
  if (typeof path === 'string' && path.replaceAll(String.fromCharCode(92), '/').includes('/workspace-inputs/packages/renderers/') && path.endsWith('package.json')) {
    const owner = JSON.parse(readFileSync(path, 'utf8'))
    if (!owner.scopeChain) throw new Error('The owner is not in the declared standalone dependency closure: ' + owner.name)
    let context = rootRequire
    for (const name of owner.scopeChain) context = nativeRequire(context.resolve(name))
    return context
  }
  return nativeRequire(path)
}
