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

const PROXY_URL = process.env.ARCA_PROXY_URL || ""
const PROXY_SECRET = process.env.ARCA_PROXY_SECRET || "transmagg-arca-proxy-2026"

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
  if (PROXY_URL) {
    // Enviar al proxy con la URL destino en header
    return fetch(PROXY_URL, {
      method: "POST",
      headers: {
        ...headers,
        "X-Target-Url": url,
        "X-Proxy-Secret": PROXY_SECRET,
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
