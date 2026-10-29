const createUnavailableError = () =>
  new Error('The script-tag viewer uses the built-in Excalidraw SVG fallback.')

export const restore = () => {
  throw createUnavailableError()
}

export const exportToSvg = async () => {
  throw createUnavailableError()
}
