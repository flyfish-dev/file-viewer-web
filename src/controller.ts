import { createViewer } from '@file-viewer/core';
import {
  DEFAULT_FILE_VIEWER_SOURCE_FILENAME,
  createFileViewerTranslator,
  getExtension,
  hasVisibleFileViewerToolbarActions,
  isFileViewerZoomButtonDisabled,
  normalizeFileViewerToolbar,
  normalizeFilename,
  readFileViewerBuffer,
  resolveFileViewerSourceFilename,
  resolveFileViewerToolbarPosition,
  resolveVisibleFileViewerToolbar,
  wrapFileViewerFileRef,
  type FileViewerAiOptions,
  type FileViewerArchiveOptions,
  type FileViewerCadOptions,
  type FileViewerDocxOptions,
  type FileViewerDocumentAnchor,
  type FileViewerDocumentChunk,
  type FileViewerEvent,
  type FileViewerEventHandler,
  type FileViewerEventType,
  type FileViewerFileRef,
  type FileViewerInstance,
  type FileViewerLifecycleContext,
  type FileViewerOperationAvailability,
  type FileViewerOperationContext,
  type FileViewerOptions,
  type FileViewerPdfOptions,
  type FileViewerPresentationOptions,
  type FileViewerSpreadsheetOptions,
  type FileViewerPublicApi,
  type FileViewerSource,
  type FileViewerSearchOptions,
  type FileViewerSearchState,
  type FileViewerThemeMode,
  type FileViewerToolbarOptions,
  type FileViewerToolbarPosition,
  type FileViewerTypstOptions,
  type FileViewerWatermarkOptions,
  type FileViewerZoomState,
  type RendererRegistry,
  type RendererSession,
} from '@file-viewer/core';

export type FileRef = FileViewerFileRef;

export type ViewerWatermarkOptions = FileViewerWatermarkOptions;
export type ViewerToolbarPosition = FileViewerToolbarPosition;
export type ViewerToolbarOptions = FileViewerToolbarOptions;
export type ViewerArchiveOptions = FileViewerArchiveOptions;
export type ViewerPdfOptions = FileViewerPdfOptions;
export type ViewerPresentationOptions = FileViewerPresentationOptions;
export type ViewerSpreadsheetOptions = FileViewerSpreadsheetOptions;
export type ViewerDocxOptions = FileViewerDocxOptions;
export type ViewerTypstOptions = FileViewerTypstOptions;
export type ViewerCadOptions = FileViewerCadOptions;
export type ViewerSearchOptions = FileViewerSearchOptions;
export type ViewerAiOptions = FileViewerAiOptions;
export type ViewerThemeMode = FileViewerThemeMode;
export type ViewerOptions = FileViewerOptions;
export type ViewerEventType = FileViewerEventType;
export type ViewerEvent = FileViewerEvent;
export type ViewerEventHandler = FileViewerEventHandler;
export type ViewerLifecycleContext = FileViewerLifecycleContext;
export type ViewerOperationContext = FileViewerOperationContext;

export interface ViewerState {
  loading: boolean;
  ready: boolean;
  error: unknown | null;
  lastEvent: ViewerEvent | null;
  lifecycle: ViewerLifecycleContext | null;
  availability: FileViewerOperationAvailability | null;
  search: FileViewerSearchState | null;
  zoom: FileViewerZoomState | null;
  location: FileViewerDocumentAnchor | null;
}

export type ViewerStateListener = (
  state: ViewerState,
  event?: ViewerEvent
) => void;

export interface ViewerMountOptions {
  url?: string;
  file?: FileRef;
  buffer?: ArrayBuffer;
  name?: string;
  filename?: string;
  type?: string;
  size?: number;
  options?: ViewerOptions;
  onEvent?: ViewerEventHandler;
  onStateChange?: ViewerStateListener;
}

export interface ViewerSourceInput {
  url?: string;
  file?: FileRef;
  buffer?: ArrayBuffer;
  filename?: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface ViewerFetchInput {
  url: string;
  signal?: AbortSignal;
  source: ViewerSourceInput;
}

export type ViewerFetchFile = (
  input: ViewerFetchInput
) => Promise<FileRef | null | undefined>;

export interface ViewerCoreOptions {
  registry?: RendererRegistry;
  fetchFile?: ViewerFetchFile;
  onError?: (error: unknown, source: ViewerSourceInput) => void;
}

export interface ViewerController {
  readonly container: HTMLElement;
  load(options: ViewerMountOptions): Promise<void>;
  update(options?: ViewerMountOptions): Promise<void>;
  reload(): Promise<void>;
  destroy(): void;
  getApi(): FileViewerPublicApi | FileViewerInstance | null;
  downloadOriginalFile(): Promise<void>;
  printRenderedHtml(): Promise<void>;
  exportRenderedHtml(): Promise<void>;
  zoomIn(): Promise<FileViewerZoomState | null>;
  zoomOut(): Promise<FileViewerZoomState | null>;
  resetZoom(): Promise<FileViewerZoomState | null>;
  searchDocument(query: string): Promise<FileViewerSearchState | null>;
  clearDocumentSearch(): Promise<FileViewerSearchState | null>;
  nextSearchResult(): Promise<FileViewerSearchState | null>;
  previousSearchResult(): Promise<FileViewerSearchState | null>;
  collectDocumentAnchors(): Promise<FileViewerDocumentAnchor[]>;
  scrollToAnchor(anchor: FileViewerDocumentAnchor | string): Promise<boolean>;
  scrollToLine(line: number): Promise<boolean>;
  getDocumentTextChunks(): FileViewerDocumentChunk[];
  getOperationAvailability(): FileViewerOperationAvailability | null;
  getZoomState(): FileViewerZoomState | null;
  getSearchState(): FileViewerSearchState | null;
  getState(): ViewerState;
  subscribe(listener: ViewerStateListener): () => void;
}

export type ViewerControllerAccessor = () => ViewerController | null;

export interface ViewerControllerHandle {
  load(options: ViewerMountOptions): Promise<void>;
  update(options?: ViewerMountOptions): Promise<void>;
  reload(): Promise<void>;
  destroy(): void;
  getController(): ViewerController | null;
  getApi(): FileViewerPublicApi | FileViewerInstance | null;
  downloadOriginalFile(): Promise<void>;
  printRenderedHtml(): Promise<void>;
  exportRenderedHtml(): Promise<void>;
  zoomIn(): Promise<FileViewerZoomState | null>;
  zoomOut(): Promise<FileViewerZoomState | null>;
  resetZoom(): Promise<FileViewerZoomState | null>;
  searchDocument(query: string): Promise<FileViewerSearchState | null>;
  clearDocumentSearch(): Promise<FileViewerSearchState | null>;
  nextSearchResult(): Promise<FileViewerSearchState | null>;
  previousSearchResult(): Promise<FileViewerSearchState | null>;
  collectDocumentAnchors(): Promise<FileViewerDocumentAnchor[]>;
  scrollToAnchor(anchor: FileViewerDocumentAnchor | string): Promise<boolean>;
  scrollToLine(line: number): Promise<boolean>;
  getDocumentTextChunks(): FileViewerDocumentChunk[];
  getOperationAvailability(): FileViewerOperationAvailability | null;
  getZoomState(): FileViewerZoomState | null;
  getSearchState(): FileViewerSearchState | null;
  getState(): ViewerState | null;
  subscribe(listener: ViewerStateListener): () => void;
}

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const hasSource = (options: ViewerMountOptions = {}) => {
  return !!(options.url || options.file || options.buffer);
};

const toViewerSourceInput = (options: ViewerMountOptions = {}): ViewerSourceInput => ({
  url: options.url,
  file: options.file,
  buffer: options.buffer,
  filename: options.filename || options.name,
  name: options.name,
  type: options.type,
  size: options.size,
});

const canUseFetch = () => typeof fetch === 'function';

const defaultFetchFile: ViewerFetchFile = async ({ url, signal }) => {
  if (!canUseFetch()) {
    throw new Error('fetch is not available in the current environment.');
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  return response.blob();
};

const resolveViewerSourceFilename = (source: ViewerSourceInput) => {
  return normalizeFilename(
    source.filename || source.name || resolveFileViewerSourceFilename({
      file: source.file,
      url: source.url,
      fallback: DEFAULT_FILE_VIEWER_SOURCE_FILENAME,
    }),
    source.type ? `preview.${source.type}` : DEFAULT_FILE_VIEWER_SOURCE_FILENAME
  );
};

const resolveViewerLoadSource = async (
  source: ViewerSourceInput,
  options: {
    fetchFile?: ViewerFetchFile;
    signal?: AbortSignal;
  } = {}
): Promise<FileViewerSource> => {
  const filename = resolveViewerSourceFilename(source);
  const type = source.type || getExtension(filename);

  if (source.buffer) {
    return {
      buffer: source.buffer,
      filename,
      type,
      size: source.size ?? source.buffer.byteLength,
      url: source.url,
    };
  }

  if (source.file) {
    const file = wrapFileViewerFileRef(source.file, filename);
    return {
      file,
      buffer: await readFileViewerBuffer(file),
      filename: file.name || filename,
      type: type || getExtension(file.name),
      size: source.size ?? file.size,
      url: source.url,
    };
  }

  if (source.url) {
    const fileRef = await (options.fetchFile || defaultFetchFile)({
      url: source.url,
      signal: options.signal,
      source,
    });
    if (!fileRef) {
      throw new Error('Downloaded file is empty.');
    }

    const file = wrapFileViewerFileRef(fileRef, filename);
    return {
      file,
      buffer: await readFileViewerBuffer(file),
      filename: file.name || filename,
      type: type || getExtension(file.name),
      size: source.size ?? file.size,
      url: source.url,
    };
  }

  return {
    filename,
    type,
  };
};

export const createViewerControllerHandle = (
  getController: ViewerControllerAccessor,
  dispose: () => void
): ViewerControllerHandle => ({
  load(options) {
    return getController()?.load(options) ?? Promise.resolve();
  },
  update(options) {
    return getController()?.update(options) ?? Promise.resolve();
  },
  reload() {
    return getController()?.reload() ?? Promise.resolve();
  },
  destroy() {
    dispose();
  },
  getController,
  getApi() {
    return getController()?.getApi() ?? null;
  },
  downloadOriginalFile() {
    return getController()?.downloadOriginalFile() ?? Promise.resolve();
  },
  printRenderedHtml() {
    return getController()?.printRenderedHtml() ?? Promise.resolve();
  },
  exportRenderedHtml() {
    return getController()?.exportRenderedHtml() ?? Promise.resolve();
  },
  zoomIn() {
    return getController()?.zoomIn() ?? Promise.resolve(null);
  },
  zoomOut() {
    return getController()?.zoomOut() ?? Promise.resolve(null);
  },
  resetZoom() {
    return getController()?.resetZoom() ?? Promise.resolve(null);
  },
  searchDocument(query) {
    return getController()?.searchDocument(query) ?? Promise.resolve(null);
  },
  clearDocumentSearch() {
    return getController()?.clearDocumentSearch() ?? Promise.resolve(null);
  },
  nextSearchResult() {
    return getController()?.nextSearchResult() ?? Promise.resolve(null);
  },
  previousSearchResult() {
    return getController()?.previousSearchResult() ?? Promise.resolve(null);
  },
  collectDocumentAnchors() {
    return getController()?.collectDocumentAnchors() ?? Promise.resolve([]);
  },
  scrollToAnchor(anchor) {
    return getController()?.scrollToAnchor(anchor) ?? Promise.resolve(false);
  },
  scrollToLine(line) {
    return getController()?.scrollToLine(line) ?? Promise.resolve(false);
  },
  getDocumentTextChunks() {
    return getController()?.getDocumentTextChunks() ?? [];
  },
  getOperationAvailability() {
    return getController()?.getOperationAvailability() ?? null;
  },
  getZoomState() {
    return getController()?.getZoomState() ?? null;
  },
  getSearchState() {
    return getController()?.getSearchState() ?? null;
  },
  getState() {
    return getController()?.getState() ?? null;
  },
  subscribe(listener) {
    return getController()?.subscribe(listener) ?? (() => {});
  },
});

const callApi = async <Result>(
  api: FileViewerInstance | null,
  action: (api: FileViewerInstance) => Promise<Result> | Result,
  fallback: Result
) => {
  if (!api) {
    return fallback;
  }
  return action(api);
};

const isAbortError = (error: unknown) => {
  return Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError');
};

const DEFAULT_TOOLBAR_AVAILABILITY: FileViewerOperationAvailability = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: false,
  zoomIn: false,
  zoomOut: false,
  zoomReset: false,
};

const DEFAULT_TOOLBAR_ZOOM_STATE: FileViewerZoomState = {
  scale: 1,
  label: '100%',
  canZoomIn: false,
  canZoomOut: false,
  canReset: false,
};

const WEB_VIEWER_STYLE = `
.file-viewer-web-shell{position:relative;width:100%;height:100%;min-height:0;display:flex;flex-direction:column;background:transparent}
.file-viewer-web-content{position:relative;flex:1 1 auto;min-height:0;min-width:0}
.file-viewer-web-toolbar{flex:0 0 auto;min-height:45px;display:inline-flex;align-items:center;justify-content:flex-end;gap:6px;padding:6px 10px;border-bottom:1px solid rgba(20,35,53,.06);background:rgba(255,255,255,.92);box-sizing:border-box;z-index:20}
.file-viewer-web-toolbar[hidden]{display:none!important}
.file-viewer-web-toolbar[data-toolbar-position="bottom-right"]{position:absolute;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));min-height:42px;padding:6px;border:1px solid rgba(20,35,53,.1);border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 18px 44px rgba(15,23,42,.16);backdrop-filter:blur(16px)}
.file-viewer-web-toolbar-group{display:inline-flex;align-items:center;gap:2px;padding:2px;border:1px solid rgba(20,35,53,.08);border-radius:999px;background:rgba(20,35,53,.035)}
.file-viewer-web-toolbar button{min-width:42px;height:30px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:#40546a;font:inherit;font-size:12px;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer}
.file-viewer-web-toolbar button:hover:not(:disabled){background:rgba(33,163,102,.1);color:#16774c}
.file-viewer-web-toolbar button:disabled{color:#aab5c0;cursor:not-allowed}
.file-viewer-web-toolbar .file-viewer-web-icon-button{width:30px;min-width:30px;padding:0;display:inline-flex;align-items:center;justify-content:center}
.file-viewer-web-toolbar .file-viewer-web-zoom-meter{min-width:48px;padding:0 8px;color:#23465e}
.file-viewer-web-toolbar[data-toolbar-position="bottom-right"] button{min-width:48px;height:32px;border-radius:999px}
.file-viewer-web-toolbar[data-toolbar-position="bottom-right"] .file-viewer-web-icon-button{width:32px;min-width:32px}
.file-viewer-web-toolbar[data-toolbar-position="bottom-right"] .file-viewer-web-zoom-meter{min-width:54px}
.file-viewer-web-shell[data-viewer-theme='dark'] .file-viewer-web-toolbar{border-color:rgba(148,163,184,.18);background:rgba(15,23,42,.9)}
.file-viewer-web-shell[data-viewer-theme='dark'] .file-viewer-web-toolbar button{color:#d7dee8}
@media (prefers-color-scheme:dark){.file-viewer-web-shell[data-viewer-theme='system'] .file-viewer-web-toolbar{border-color:rgba(148,163,184,.18);background:rgba(15,23,42,.9)}.file-viewer-web-shell[data-viewer-theme='system'] .file-viewer-web-toolbar button{color:#d7dee8}}
`;

const createButton = (
  documentRef: Document,
  label: string,
  className: string,
  onClick: () => void | Promise<unknown>
) => {
  const button = documentRef.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', () => {
    void onClick();
  });
  return button;
};

export const mountViewer = (
  container: HTMLElement,
  initialOptions: ViewerMountOptions = {},
  coreOptions: ViewerCoreOptions = {}
): ViewerController => {
  if (!isBrowser()) {
    throw new Error('Flyfish File Viewer can only be mounted in a browser DOM environment.');
  }

  const documentRef = container.ownerDocument;
  const styleEl = documentRef.createElement('style');
  styleEl.textContent = WEB_VIEWER_STYLE;
  const shell = documentRef.createElement('div');
  shell.className = 'file-viewer-web-shell';
  const toolbarEl = documentRef.createElement('div');
  toolbarEl.className = 'file-viewer-web-toolbar';
  const contentEl = documentRef.createElement('div');
  contentEl.className = 'file-viewer-web-content';
  shell.append(toolbarEl, contentEl);
  container.replaceChildren(styleEl, shell);

  let disposed = false;
  let currentOptions: ViewerMountOptions = initialOptions;
  let currentSource: ViewerSourceInput | null = hasSource(currentOptions)
    ? toViewerSourceInput(currentOptions)
    : null;
  let abortController: AbortController | null = null;
  const listeners = new Set<ViewerStateListener>();
  const state: ViewerState = {
    loading: false,
    ready: false,
    error: null,
    lastEvent: null,
    lifecycle: null,
    availability: null,
    search: null,
    zoom: null,
    location: null,
  };
  const snapshotState = (): ViewerState => ({
    ...state,
    search: state.search
      ? { ...state.search, matches: [...state.search.matches] }
      : null,
  });
  const getCurrentExtension = () => {
    if (state.lifecycle?.type) {
      return state.lifecycle.type;
    }
    return currentSource ? getExtension(resolveViewerSourceFilename(currentSource)) : '';
  };
  let instance: FileViewerInstance;
  const getToolbarZoomState = () => state.zoom || instance.getZoomState() || DEFAULT_TOOLBAR_ZOOM_STATE;
  const getToolbarAvailability = () => state.availability || instance.getCapabilities() || DEFAULT_TOOLBAR_AVAILABILITY;
  const syncShellTheme = () => {
    shell.dataset.viewerTheme = currentOptions.options?.theme || 'light';
  };
  let controller: ViewerController | null = null;
  const renderToolbar = () => {
    if (disposed) {
      return;
    }

    syncShellTheme();
    const options = currentOptions.options || {};
    const toolbar = normalizeFileViewerToolbar(options);
    const availability = getToolbarAvailability();
    const visibleToolbar = resolveVisibleFileViewerToolbar(toolbar, availability);
    const showToolbar = hasVisibleFileViewerToolbarActions(visibleToolbar);
    const toolbarPosition = resolveFileViewerToolbarPosition(options, getCurrentExtension());
    const toolbarDisabled = state.loading || !!state.error;
    const zoomState = getToolbarZoomState();
    const t = createFileViewerTranslator(options);
    toolbarEl.hidden = !showToolbar;
    toolbarEl.dataset.toolbarPosition = toolbarPosition;
    toolbarEl.replaceChildren();

    if (!showToolbar) {
      return;
    }

    if (visibleToolbar.zoom) {
      const group = documentRef.createElement('div');
      group.className = 'file-viewer-web-toolbar-group';
      group.setAttribute('aria-label', t('toolbar.zoomGroup'));

      if (availability.zoomOut) {
        const button = createButton(documentRef, '-', 'file-viewer-web-icon-button', () => controller?.zoomOut());
        button.title = t('toolbar.zoomOut');
        button.setAttribute('aria-label', t('toolbar.zoomOut'));
        button.disabled = isFileViewerZoomButtonDisabled({
          action: 'canZoomOut',
          availability,
          toolbarDisabled,
          zoomState,
        });
        group.appendChild(button);
      }

      if (availability.zoomReset) {
        const meter = createButton(documentRef, zoomState.label, 'file-viewer-web-zoom-meter', () => controller?.resetZoom());
        meter.title = t('toolbar.zoomReset');
        meter.disabled = isFileViewerZoomButtonDisabled({
          action: 'canReset',
          availability,
          toolbarDisabled,
          zoomState,
        });
        group.appendChild(meter);
      }

      if (availability.zoomIn) {
        const button = createButton(documentRef, '+', 'file-viewer-web-icon-button', () => controller?.zoomIn());
        button.title = t('toolbar.zoomIn');
        button.setAttribute('aria-label', t('toolbar.zoomIn'));
        button.disabled = isFileViewerZoomButtonDisabled({
          action: 'canZoomIn',
          availability,
          toolbarDisabled,
          zoomState,
        });
        group.appendChild(button);
      }

      if (availability.zoomReset) {
        const button = createButton(documentRef, '1:1', 'file-viewer-web-icon-button', () => controller?.resetZoom());
        button.title = t('toolbar.zoomReset');
        button.setAttribute('aria-label', t('toolbar.zoomReset'));
        button.disabled = isFileViewerZoomButtonDisabled({
          action: 'canReset',
          availability,
          toolbarDisabled,
          zoomState,
        });
        group.appendChild(button);
      }

      if (group.childElementCount) {
        toolbarEl.appendChild(group);
      }
    }

    if (visibleToolbar.download) {
      const button = createButton(documentRef, t('toolbar.download'), '', () => controller?.downloadOriginalFile());
      button.title = t('toolbar.downloadTitle');
      button.disabled = toolbarDisabled;
      toolbarEl.appendChild(button);
    }
    if (visibleToolbar.print) {
      const button = createButton(documentRef, t('toolbar.print'), '', () => controller?.printRenderedHtml());
      button.title = t('toolbar.printTitle');
      button.disabled = toolbarDisabled;
      toolbarEl.appendChild(button);
    }
    if (visibleToolbar.exportHtml) {
      const button = createButton(documentRef, t('toolbar.exportHtml'), '', () => controller?.exportRenderedHtml());
      button.title = t('toolbar.exportHtmlTitle');
      button.disabled = toolbarDisabled;
      toolbarEl.appendChild(button);
    }
  };
  const notifyState = (event?: ViewerEvent) => {
    const snapshot = snapshotState();
    renderToolbar();
    currentOptions.onStateChange?.(snapshot, event);
    listeners.forEach(listener => listener(snapshot, event));
  };
  const applyViewerEvent = (event: ViewerEvent) => {
    state.lastEvent = event;
    if (event.type === 'load-start') {
      state.loading = true;
      state.ready = false;
      state.error = null;
      state.lifecycle = event.payload;
    } else if (event.type === 'load-complete') {
      state.loading = false;
      state.ready = true;
      state.lifecycle = event.payload;
    } else if (event.type === 'unload-start') {
      state.loading = true;
      state.ready = false;
      state.lifecycle = event.payload;
    } else if (event.type === 'unload-complete') {
      state.loading = false;
      state.ready = false;
      state.lifecycle = event.payload;
    } else if (event.type === 'operation-availability-change') {
      state.availability = event.payload;
    } else if (event.type === 'search-change') {
      state.search = event.payload;
    } else if (event.type === 'location-change') {
      state.location = event.payload;
    } else if (event.type === 'zoom-change') {
      state.zoom = event.payload;
    }
    currentOptions.onEvent?.(event);
    notifyState(event);
  };
  instance = createViewer(contentEl, {
    registry: coreOptions.registry,
    options: currentOptions.options,
    onEvent: applyViewerEvent,
  });
  renderToolbar();

  const cancel = () => {
    abortController?.abort();
    abortController = null;
  };

  const loadSource = async (nextSource: ViewerSourceInput): Promise<RendererSession | null> => {
    cancel();
    currentSource = nextSource;
    abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const controller = abortController;
    try {
      state.loading = true;
      state.error = null;
      notifyState();
      const resolvedSource = await resolveViewerLoadSource(nextSource, {
        fetchFile: coreOptions.fetchFile,
        signal: controller?.signal,
      });
      return await instance.load(resolvedSource);
    } catch (error) {
      if (isAbortError(error) && controller?.signal.aborted) {
        return null;
      }
      state.loading = false;
      state.ready = false;
      state.error = error;
      notifyState();
      coreOptions.onError?.(error, nextSource);
      throw error;
    } finally {
      if (abortController === controller) {
        abortController = null;
      }
    }
  };

  if (currentSource) {
    void loadSource(currentSource);
  }

  controller = {
    container,
    async load(nextOptions) {
      if (disposed) return;
      currentOptions = nextOptions;
      instance.updateOptions(currentOptions.options || {});
      renderToolbar();
      if (hasSource(currentOptions)) {
        await loadSource(toViewerSourceInput(currentOptions));
      }
    },
    async update(nextOptions = {}) {
      if (disposed) return;
      currentOptions = {
        ...currentOptions,
        ...nextOptions,
        options: nextOptions.options ?? currentOptions.options,
      };
      instance.updateOptions(currentOptions.options || {});
      renderToolbar();
      if (hasSource(currentOptions)) {
        await loadSource(toViewerSourceInput(currentOptions));
      } else {
        currentSource = null;
        await instance.load({ filename: DEFAULT_FILE_VIEWER_SOURCE_FILENAME });
      }
    },
    async reload() {
      if (disposed) return;
      if (currentSource) {
        await loadSource(currentSource);
      }
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      cancel();
      void instance.destroy('component-unmount');
      container.innerHTML = '';
    },
    getApi() {
      return instance;
    },
    downloadOriginalFile() {
      return callApi(instance, api => api.download(), undefined);
    },
    printRenderedHtml() {
      return callApi(instance, api => api.print(), undefined);
    },
    exportRenderedHtml() {
      return callApi(
        instance,
        api => api.exportHtml({ download: true }).then(() => undefined),
        undefined
      );
    },
    zoomIn() {
      return callApi(instance, api => api.zoomIn(), null);
    },
    zoomOut() {
      return callApi(instance, api => api.zoomOut(), null);
    },
    resetZoom() {
      return callApi(instance, api => api.resetZoom(), null);
    },
    searchDocument(query) {
      return callApi(instance, api => api.search(query), null);
    },
    clearDocumentSearch() {
      return callApi(instance, api => api.clearSearch(), null);
    },
    nextSearchResult() {
      return callApi(instance, api => api.nextSearchResult(), null);
    },
    previousSearchResult() {
      return callApi(instance, api => api.previousSearchResult(), null);
    },
    collectDocumentAnchors() {
      return callApi(instance, api => api.collectDocumentAnchors(), []);
    },
    scrollToAnchor(anchor) {
      return callApi(instance, api => api.scrollToDocumentAnchor(anchor), false);
    },
    scrollToLine(line) {
      return callApi(instance, api => api.scrollToLine(line), false);
    },
    getDocumentTextChunks() {
      return instance.getDocumentTextChunks();
    },
    getOperationAvailability() {
      return instance.getCapabilities();
    },
    getZoomState() {
      return instance.getZoomState();
    },
    getSearchState() {
      return instance.getSearchState();
    },
    getState() {
      return snapshotState();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshotState());
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return controller;
};
