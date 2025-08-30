// Serve only the production build in dist/
const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()
const PORT = process.env.PORT || 8080

const distDir = path.join(__dirname, 'dist')

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  // Serve the built production bundle only
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
} else {
  // No build present — return an instruction to build instead of exposing sources
  app.get('*', (req, res) => {
    res.status(500).send('No build found. Run `npm run build` to produce the dist/ folder.')
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
