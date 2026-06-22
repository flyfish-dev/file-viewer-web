import {
  createViewerControllerHandle,
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
  mountViewer
} from './index'

const FlyfishFileViewerWeb = {
  createViewerControllerHandle,
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
  mountViewer
}

type FlyfishFileViewerWebGlobal = typeof FlyfishFileViewerWeb

declare global {
  interface Window {
    FlyfishFileViewerWeb?: FlyfishFileViewerWebGlobal
  }
}

if (typeof window !== 'undefined') {
  window.FlyfishFileViewerWeb = FlyfishFileViewerWeb
  defineFileViewerElement()
}

export {
  createViewerControllerHandle,
  defineFileViewerElement,
  FileViewerElement,
  FILE_VIEWER_ELEMENT_TAG,
  mountViewer
}

export default FlyfishFileViewerWeb
