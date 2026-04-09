/**
 * Proxy ARCA — Reenvía requests SOAP a ARCA desde IP argentina.
 * Corre en tu PC y se expone via Cloudflare Tunnel.
 *
 * Uso: node index.js
 * Puerto: 3100 (configurable con PORT=XXXX)
 */

const http = require("http")
const https = require("https")
const tls = require("tls")
const { URL } = require("url")

// Permitir DH keys chicas que usa ARCA/AFIP
tls.DEFAULT_MIN_VERSION = "TLSv1"
const origCreateSecureContext = tls.createSecureContext
tls.createSecureContext = function (options) {
  options = options || {}
  options.ciphers = "DEFAULT:@SECLEVEL=0"
  return origCreateSecureContext.call(tls, options)
}

const PORT = process.env.PORT || 3100

// Solo estas URLs están permitidas
const ALLOWED_TARGETS = [
  "https://wsaa.afip.gov.ar",
  "https://servicios1.afip.gov.ar",
  "https://wsaahomo.afip.gov.ar",
  "https://wswhomo.afip.gov.ar",
]

// Token secreto para que solo tu app pueda usar el proxy
const PROXY_SECRET = process.env.PROXY_SECRET || "transmagg-arca-proxy-2026"

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type, X-Proxy-Secret, X-Target-Url",
    })
    res.end()
    return
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Solo POST" }))
    return
  }

  // Verificar secreto
  const secret = req.headers["x-proxy-secret"]
  if (secret !== PROXY_SECRET) {
    res.writeHead(403, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "No autorizado" }))
    return
  }

  // URL destino viene en el header
  const targetUrl = req.headers["x-target-url"]
  if (!targetUrl) {
    res.writeHead(400, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Falta X-Target-Url" }))
    return
  }

  // Validar que la URL sea de ARCA
  const isAllowed = ALLOWED_TARGETS.some((base) => targetUrl.startsWith(base))
  if (!isAllowed) {
    res.writeHead(403, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "URL no permitida" }))
    return
  }

  // Leer el body del request
  const chunks = []
  req.on("data", (chunk) => chunks.push(chunk))
  req.on("end", () => {
    const body = Buffer.concat(chunks)
    const parsed = new URL(targetUrl)

    // Buscar SOAPAction sin importar el casing del header
    const soapAction = req.headers["soapaction"] || req.headers["SOAPAction"] || req.headers["Soapaction"] || ""

    const forwardHeaders = {
      "Content-Type": req.headers["content-type"] || "text/xml; charset=utf-8",
      "Content-Length": body.length,
      "SOAPAction": soapAction,
    }

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: forwardHeaders,
    }

    console.log(`[${new Date().toISOString()}] -> ${targetUrl}`)

    const proxyReq = https.request(options, (proxyRes) => {
      const responseChunks = []
      proxyRes.on("data", (chunk) => responseChunks.push(chunk))
      proxyRes.on("end", () => {
        const responseBody = Buffer.concat(responseChunks)
        console.log(`[${new Date().toISOString()}] <- ${proxyRes.statusCode} (${responseBody.length} bytes)`)
        res.writeHead(proxyRes.statusCode, {
          "Content-Type": proxyRes.headers["content-type"] || "text/xml",
          "Access-Control-Allow-Origin": "*",
        })
        res.end(responseBody)
      })
    })

    proxyReq.on("error", (err) => {
      console.error(`[${new Date().toISOString()}] ERROR:`, err.message)
      res.writeHead(502, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: `Error al contactar ARCA: ${err.message}` }))
    })

    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy()
      res.writeHead(504, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Timeout al contactar ARCA" }))
    })

    proxyReq.end(body)
  })
})

server.listen(PORT, () => {
  console.log(`Proxy ARCA corriendo en http://localhost:${PORT}`)
  console.log("Esperando requests...")
})
