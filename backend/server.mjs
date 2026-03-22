import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadParentEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(__dirname, '..', name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const k = t.slice(0, i).trim()
      let v = t.slice(i + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (process.env[k] === undefined) process.env[k] = v
    }
  }
}

loadParentEnv()

const PORT = Number(process.env.PORT || 8787)
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || ''

async function ssFetch(pathAndQuery) {
  const url = new URL(pathAndQuery, 'https://api.semanticscholar.org')
  const headers = { Accept: 'application/json' }
  if (API_KEY) headers['x-api-key'] = API_KEY
  const r = await fetch(url, { headers })
  const body = await r.text()
  return { status: r.status, body }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const host = req.headers.host || 'localhost'
  const u = new URL(req.url || '/', `http://${host}`)

  try {
    if (req.method === 'GET' && u.pathname === '/api/paper-search') {
      const q = u.searchParams.get('query') || u.searchParams.get('q') || ''
      const limit = u.searchParams.get('limit') || '15'
      const fields =
        'paperId,title,authors,year,abstract,url,citationCount,venue,openAccessPdf,externalIds'
      const path = `/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&fields=${encodeURIComponent(fields)}`
      const { status, body } = await ssFetch(path)
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(body)
      return
    }

    if (req.method === 'GET' && u.pathname === '/api/paper-recommendations') {
      const id = u.searchParams.get('paperId')
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'paperId required' }))
        return
      }
      const limit = u.searchParams.get('limit') || '10'
      const fields =
        'paperId,title,authors,year,abstract,url,citationCount,venue,openAccessPdf'
      const path = `/recommendations/v1/papers/forpaper/${encodeURIComponent(id)}?limit=${encodeURIComponent(limit)}&fields=${encodeURIComponent(fields)}`
      const { status, body } = await ssFetch(path)
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(body)
      return
    }

    if (req.method === 'GET' && u.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(e?.message || e) }))
  }
})

server.listen(PORT, () => {
  console.log(`[backend] http://localhost:${PORT} (Semantic Scholar proxy)`)
})

