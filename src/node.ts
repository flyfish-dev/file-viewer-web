import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  listFileViewerRendererAssetManifests,
  type FileViewerRendererAssetDefinition,
  type FileViewerRendererAssetManifest
} from '@file-viewer/core/assets'

export interface CopyViewerAssetsOptions {
  /**
   * Target static directory. Defaults to the host project's `public/file-viewer`.
   */
  targetDir?: string
  /**
   * Override the bundled viewer source directory, mainly for tests and release tooling.
   */
  sourceDir?: string
  /**
   * Whether to clear the target directory before copying. Defaults to true.
   */
  clean?: boolean
}

export interface ValidateViewerAssetsOptions {
  /**
   * Viewer static directory. Defaults to this package's bundled `viewer/`.
   */
  sourceDir?: string
}

export interface ViewerAssetValidationItem {
  id: string
  rendererId: string
  kind: FileViewerRendererAssetDefinition['kind']
  target: FileViewerRendererAssetDefinition['target']
  required: boolean
  relativePath: string
  absolutePath: string
  exists: boolean
  description: string
}

export interface ViewerAssetValidationResult {
  sourceDir: string
  valid: boolean
  checkedAt: string
  assets: ViewerAssetValidationItem[]
  missingRequired: ViewerAssetValidationItem[]
  missingOptional: ViewerAssetValidationItem[]
}

export type ViewerAssetManifestValidationItem = Omit<
  ViewerAssetValidationItem,
  'absolutePath'
>

export interface ViewerAssetManifestValidationResult {
  valid: boolean
  checkedAt: string
  assets: ViewerAssetManifestValidationItem[]
  missingRequired: ViewerAssetManifestValidationItem[]
  missingOptional: ViewerAssetManifestValidationItem[]
}

export interface ViewerAssetManifestFile {
  schemaVersion: 1
  generatedAt: string
  rendererAssetManifests: FileViewerRendererAssetManifest[]
  validation: ViewerAssetManifestValidationResult
}

export interface CopyViewerAssetsResult {
  sourceDir: string
  targetDir: string
  assetBaseUrl: string
  assetManifestPath: string
  validation: ViewerAssetValidationResult
}

const distDir = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(distDir, '..')

export const DEFAULT_VIEWER_PUBLIC_DIR = 'public/file-viewer'
export const DEFAULT_VIEWER_ASSET_BASE_URL = '/file-viewer/'
export const VIEWER_ASSET_MANIFEST_FILENAME = 'flyfish-viewer-assets.json'

export const getViewerAssetDir = () => resolve(packageDir, 'viewer')

export const getDefaultViewerTargetDir = () => {
  return resolve(process.env.INIT_CWD || process.cwd(), DEFAULT_VIEWER_PUBLIC_DIR)
}

const removeMacMetadata = async (dir: string) => {
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

const isExpectedAssetKind = (
  asset: FileViewerRendererAssetDefinition,
  pathStat: { isDirectory(): boolean; isFile(): boolean }
) => {
  return asset.kind === 'directory' || asset.kind === 'wasm-directory'
    ? pathStat.isDirectory()
    : pathStat.isFile()
}

export const validateViewerAssets = async (
  options: ValidateViewerAssetsOptions = {}
): Promise<ViewerAssetValidationResult> => {
  const sourceDir = resolve(options.sourceDir || getViewerAssetDir())
  const assets = await Promise.all(
    listFileViewerRendererAssetManifests()
      .flatMap(manifest => manifest.assets)
      .filter(asset => asset.target === 'public' && asset.defaultPath)
      .map(async asset => {
        const relativePath = asset.defaultPath || ''
        const absolutePath = resolve(sourceDir, relativePath)
        let exists = false

        try {
          exists = isExpectedAssetKind(asset, await stat(absolutePath))
        } catch {
          exists = false
        }

        return {
          id: asset.id,
          rendererId: asset.rendererId,
          kind: asset.kind,
          target: asset.target,
          required: asset.required,
          relativePath,
          absolutePath,
          exists,
          description: asset.description
        } satisfies ViewerAssetValidationItem
      })
  )
  const missingRequired = assets.filter(asset => asset.required && !asset.exists)
  const missingOptional = assets.filter(asset => !asset.required && !asset.exists)

  return {
    sourceDir,
    valid: missingRequired.length === 0,
    checkedAt: new Date().toISOString(),
    assets,
    missingRequired,
    missingOptional
  }
}

const toViewerAssetManifestValidationItem = (
  item: ViewerAssetValidationItem
): ViewerAssetManifestValidationItem => {
  const { absolutePath: _absolutePath, ...manifestItem } = item
  return manifestItem
}

export const toViewerAssetManifestValidation = (
  validation: ViewerAssetValidationResult
): ViewerAssetManifestValidationResult => {
  return {
    valid: validation.valid,
    checkedAt: validation.checkedAt,
    assets: validation.assets.map(toViewerAssetManifestValidationItem),
    missingRequired: validation.missingRequired.map(toViewerAssetManifestValidationItem),
    missingOptional: validation.missingOptional.map(toViewerAssetManifestValidationItem)
  }
}

export const buildViewerAssetManifest = (
  validation: ViewerAssetValidationResult
): ViewerAssetManifestFile => {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rendererAssetManifests: listFileViewerRendererAssetManifests(),
    validation: toViewerAssetManifestValidation(validation)
  }
}

export const writeViewerAssetManifest = async (
  targetDir: string,
  manifest: ViewerAssetManifestFile
) => {
  const assetManifestPath = resolve(targetDir, VIEWER_ASSET_MANIFEST_FILENAME)
  await writeFile(assetManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return assetManifestPath
}

export const copyViewerAssets = async (
  options: CopyViewerAssetsOptions = {}
): Promise<CopyViewerAssetsResult> => {
  const sourceDir = resolve(options.sourceDir || getViewerAssetDir())
  const targetDir = resolve(options.targetDir || getDefaultViewerTargetDir())

  if (!existsSync(sourceDir)) {
    throw new Error(`Missing viewer asset output: ${sourceDir}`)
  }

  if (options.clean !== false) {
    await rm(targetDir, { force: true, recursive: true })
  }

  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true })
  await removeMacMetadata(targetDir)
  const validation = await validateViewerAssets({ sourceDir: targetDir })
  const assetManifestPath = await writeViewerAssetManifest(
    targetDir,
    buildViewerAssetManifest(validation)
  )

  if (!validation.valid) {
    const missing = validation.missingRequired
      .map(asset => `${asset.rendererId}:${asset.relativePath}`)
      .join(', ')
    throw new Error(`Viewer static assets are missing required resources: ${missing}`)
  }

  return {
    sourceDir,
    targetDir,
    assetBaseUrl: DEFAULT_VIEWER_ASSET_BASE_URL,
    assetManifestPath,
    validation
  }
}
