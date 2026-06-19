import {
  createViewerControllerHandle,
  mountViewer
} from './index'

const FlyfishFileViewerWeb = {
  createViewerControllerHandle,
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
}

export {
  createViewerControllerHandle,
  mountViewer
}

export default FlyfishFileViewerWeb
