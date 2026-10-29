import { isAbsolute } from 'node:path'

/** Retain the physical modules actually emitted by Rollup, including Workers. */
export function bundleInputPlugin(inputs) {
  return {
    name: 'file-viewer-bundle-input-inventory',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of Object.keys(output.modules)) {
          if (isAbsolute(id) && !id.startsWith('\0')) inputs.add(id.split('?')[0])
        }
      }
    }
  }
}
