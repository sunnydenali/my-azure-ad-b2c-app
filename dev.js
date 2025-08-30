const esbuild = require('esbuild')
const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 8080
const distDir = path.join(__dirname, 'dist')
fs.mkdirSync(distDir, { recursive: true })

// write a minimal dev index.html that loads the dev bundle and the external HMR client
function writeDevIndex() {
  const html = '<!doctype html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta charset="utf-8" />\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '    <title>dev - my-azure-ad-b2c-app</title>\n' +
    '    <link rel="stylesheet" href="./index.css">\n' +
    '  </head>\n' +
    '  <body>\n' +
    '    <div id="root"></div>\n' +
    '    <script type="module" src="./hmr-client.js"></script>\n' +
    '  </body>\n' +
    '</html>'
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8')
}

// copy hmr client into dist so index.html can import it
function copyHmrClient() {
  const src = path.join(__dirname, 'src', 'hmr-client.js')
  const dest = path.join(distDir, 'hmr-client.js')
  try {
    if (fs.existsSync(src)) fs.copyFileSync(src, dest)
  } catch (e) {
    console.warn('Failed to copy HMR client:', e)
  }
}

writeDevIndex()

// ensure css and hmr client are present in dist and copy on rebuild
function copyCss() {
  const srcCss = path.join(__dirname, 'src', 'index.css')
  const destCss = path.join(distDir, 'index.css')
  try {
    if (fs.existsSync(srcCss)) fs.copyFileSync(srcCss, destCss)
  } catch (e) {
    console.warn('Failed to copy CSS:', e)
  }
}

// copy initial css and hmr client
copyCss()
copyHmrClient()

// onRebuild handler extracted to a named function to avoid unused-function warnings
const onRebuild = (error, result) => {
  // copy css and hmr client after rebuild in case they changed
  copyCss()
  copyHmrClient()
  if (error) {
    console.error('Build failed:', error)
    const payload = formatEsbuildError(error, result)
    if (wss) sendAll(JSON.stringify({ type: 'error', payload }))
  } else {
    console.log('Build succeeded')
    if (wss) sendAll(JSON.stringify({ type: 'update' }))
  }
}

// start esbuild in watch mode producing ESM so dynamic import works for HMR
let wss
esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  sourcemap: true,
  outfile: path.join(distDir, 'bundle.js'),
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  format: 'esm',
  watch: { onRebuild }
}).then(() => {
  console.log('Initial build complete')
}).catch((e) => {
  console.error(e)
  process.exit(1)
})

function formatEsbuildError(error, result) {
  try {
    const errs = (result && result.errors && result.errors.length) ? result.errors : (error && error.errors ? error.errors : null)
    if (errs && errs.length) {
      return errs.map(e => {
        const loc = e.location ? `${e.location.file}:${e.location.line}:${e.location.column}` : ''
        return `${loc}\n${e.text}`
      }).join('\n\n')
    }
    return error && error.message ? error.message : JSON.stringify(error)
  } catch (e) {
    return String(error)
  }
}

function sendAll(msg) {
  wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(msg) })
}

// start express server serving dist/
const app = express()
app.use(express.static(distDir))

const server = http.createServer(app)

// attach websocket server for live-reload/hmr
wss = new WebSocket.Server({ server, path: '/ws' })
// no ws parameter because it's unused in the connection handler
wss.on('connection', () => {
  console.log('HMR client connected')
})

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`)
})
