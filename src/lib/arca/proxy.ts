/**
 * Proxy ARCA — Reenvía requests SOAP a través de un proxy local
 * cuando ARCA bloquea IPs de cloud providers (Vercel, AWS, etc).
 *
 * Configuración via variables de entorno:
 * - ARCA_PROXY_URL: URL del proxy (ej: https://mi-tunel.trycloudflare.com)
 * - ARCA_PROXY_SECRET: secreto compartido con el proxy
 *
 * Si ARCA_PROXY_URL no está definida, las llamadas van directo a ARCA.
 */

/**
 * fetchArcaSOAP: (url, headers, body, timeout) -> Promise<Response>
 *
 * Si hay proxy configurado, reenvía via proxy.
 * Si no, llama directo a ARCA.
 */
export async function fetchArcaSOAP(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number
): Promise<Response> {
  // Leer en cada request (no cachear en top-level por si Vercel reutiliza el módulo)
  const proxyUrl = process.env.ARCA_PROXY_URL || ""
  const proxySecret = process.env.ARCA_PROXY_SECRET || "transmagg-arca-proxy-2026"

  console.info("[ARCA-PROXY]", proxyUrl ? `Usando proxy: ${proxyUrl}` : "Sin proxy, llamada directa a ARCA", "| Target:", url)

  if (proxyUrl) {
    return fetch(proxyUrl, {
      method: "POST",
      headers: {
        ...headers,
        "X-Target-Url": url,
        "X-Proxy-Secret": proxySecret,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })
  }

  // Directo a ARCA
  return fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })
}
