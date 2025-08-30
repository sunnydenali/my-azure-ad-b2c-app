import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

let root = null

// simple app with state to demonstrate HMR state preservation
function App({ initialState = {} }) {
  const [count, setCount] = useState(initialState.count || 0)

  useEffect(() => {
    // expose state for debugging
    window.__APP_STATE = { count }
  }, [count])

  return (
    <div className="app">
      <header>
        <h1>my-azure-ad-b2c-app</h1>
        <p>Barebones React app (no TypeScript, bundled with esbuild)</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setCount((c) => c - 1)}>-</button>
          <span style={{ margin: '0 12px' }}>Count: {count}</span>
          <button onClick={() => setCount((c) => c + 1)}>+</button>
        </div>
      </header>
    </div>
  )
}

export function mount(hmrData) {
  const rootEl = document.getElementById('root')
  root = createRoot(rootEl)
  const initialState = hmrData && hmrData.state ? hmrData.state : {}
  root.render(
    <React.StrictMode>
      <App initialState={initialState} />
    </React.StrictMode>
  )
}

export function unmount() {
  if (root) {
    try { root.unmount() } catch (e) { /* ignore */ }
    root = null
  }
}

// HMR helpers: expose dispose/accept hooks for the dev HMR runtime
export const __hmr = {
  dispose() {
    // return serializable state
    return { state: { count: (window.__APP_STATE && window.__APP_STATE.count) || 0 } }
  },
  accept(data) {
    // called after module is re-imported; caller will pass previous data
    // lifecycle handled in mount(hmrData)
    // noop here
  }
}

// Initial mount when loaded normally
mount()

// Expose HMR hooks on window in development so static analysis sees usage and for debugging
if (typeof window !== 'undefined') {
  try {
    window.__APP_HMR = { mount, unmount, __hmr }
  } catch (e) {
    // ignore
  }
}

// Touch file to trigger HMR rebuild
// HMR touch: 2025-08-30T19:45:00Z
// HMR touch 2:
