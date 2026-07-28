let loadPromise: Promise<any> | null = null

const ZOOM_SCRIPT_SRC = '/zoom/zoomus-websdk-embedded.umd.min.js'

function ensureReactGlobals(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    (window as any).React &&
    (window as any).ReactDOM
  ) {
    return Promise.resolve()
  }

  return Promise.all([
    import('react'),
    import('react-dom/client'),
  ]).then(([React, ReactDOM]) => {
    const r = React.default || React
    const rd = ReactDOM.default || ReactDOM
    ;(window as any).React = r
    ;(window as any).ReactDOM = rd
  })
}

function loadZoomScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${ZOOM_SCRIPT_SRC}"]`)
    if (existing) {
      resolve((window as any).ReactWidgets)
      return
    }

    const script = document.createElement('script')
    script.src = ZOOM_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve((window as any).ReactWidgets)
    script.onerror = () => reject(new Error('Failed to load Zoom SDK script'))
    document.head.appendChild(script)
  })
}

export async function getZoomClientModule(): Promise<any> {
  if (!loadPromise) {
    loadPromise = ensureReactGlobals().then(() => loadZoomScript())
  }
  return loadPromise
}
