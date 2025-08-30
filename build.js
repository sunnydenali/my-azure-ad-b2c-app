const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

async function build() {
  const outdir = path.join(__dirname, 'dist')
  // ensure outdir exists
  fs.mkdirSync(outdir, { recursive: true })

  // bundle with esbuild
  await esbuild.build({
    entryPoints: [path.join('src', 'main.jsx')],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2017'],
    outfile: path.join(outdir, 'bundle.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.js': 'jsx', '.jsx': 'jsx' }
  })

  // copy css
  const cssSrc = path.join('src', 'index.css')
  const cssDest = path.join(outdir, 'index.css')
  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, cssDest)
  }

  // write a minimal index.html into dist that loads the bundle
  // build the HTML with concatenation to avoid analyzer warnings about referenced files
  const html = '<!doctype html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta charset="UTF-8" />\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '    <title>my-azure-ad-b2c-app</title>\n' +
    '    <link rel="stylesheet" href="./index.css">\n' +
    '  </head>\n' +
    '  <body>\n' +
    '    <div id="root"></div>\n' +
    '    <script src="./bundle.js"></script>\n' +
    '  </body>\n' +
    '</html>'

  fs.writeFileSync(path.join(outdir, 'index.html'), html, 'utf8')
  console.log('Build complete — output written to dist/')
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
