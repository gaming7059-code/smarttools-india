import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

function pdfjsAssetsPlugin(): Plugin {
  return {
    name: 'pdfjs-assets-sync',
    buildStart() {
      const targetDir = path.resolve(process.cwd(), 'public/pdfjs')
      const workerTarget = path.join(targetDir, 'pdf.worker.min.mjs')
      if (!fs.existsSync(workerTarget)) {
        fs.mkdirSync(targetDir, { recursive: true })
        const sourceDir = path.resolve(process.cwd(), 'node_modules/pdfjs-dist')
        fs.copyFileSync(path.join(sourceDir, 'build/pdf.worker.min.mjs'), workerTarget)
        fs.cpSync(path.join(sourceDir, 'cmaps'), path.join(targetDir, 'cmaps'), { recursive: true })
        fs.cpSync(path.join(sourceDir, 'standard_fonts'), path.join(targetDir, 'standard_fonts'), { recursive: true })
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (url === '/assets/pdf.worker.min.mjs') {
          const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
          if (fs.existsSync(workerPath)) {
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            fs.createReadStream(workerPath).pipe(res)
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [pdfjsAssetsPlugin(), react(), tailwindcss()],
})
