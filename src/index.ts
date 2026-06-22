import {
  createViewerControllerHandle,
  mountViewer as mountCoreViewer,
  type ViewerController,
  type ViewerMountOptions,
  type ViewerCoreOptions,
} from './controller.js'
import { fileViewerCoreRendererRegistry } from '@file-viewer/core'
import {
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
} from './element.js'

export const mountViewer = (
  container: HTMLElement,
  initialOptions: ViewerMountOptions = {},
  coreOptions: ViewerCoreOptions = {}
): ViewerController => {
  return mountCoreViewer(container, initialOptions, {
    registry: fileViewerCoreRendererRegistry,
    ...coreOptions,
  })
}

const FlyfishFileViewerWeb = {
  createViewerControllerHandle,
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
  mountViewer,
}

export { createViewerControllerHandle }
export {
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
}
export type {
  FileViewerElementErrorDetail,
  FileViewerElementEventName,
  FileViewerElementReadyDetail,
  FileViewerElementSource,
  FileViewerElementStateChangeDetail,
} from './element.js'

export type {
  FileRef,
  ViewerAiOptions,
  ViewerArchiveOptions,
  ViewerCadOptions,
  ViewerController,
  ViewerControllerAccessor,
  ViewerControllerHandle,
  ViewerDocxOptions,
  ViewerEvent,
  ViewerEventHandler,
  ViewerEventType,
  ViewerFetchFile,
  ViewerFetchInput,
  ViewerMountOptions,
  ViewerOptions,
  ViewerPdfOptions,
  ViewerSpreadsheetOptions,
  ViewerCoreOptions,
  ViewerSearchOptions,
  ViewerSourceInput,
  ViewerThemeMode,
  ViewerToolbarOptions,
  ViewerToolbarPosition,
  ViewerTypstOptions,
  ViewerWatermarkOptions,
  ViewerLifecycleContext,
  ViewerOperationContext,
  ViewerState,
  ViewerStateListener,
} from './controller.js'

export default FlyfishFileViewerWeb
