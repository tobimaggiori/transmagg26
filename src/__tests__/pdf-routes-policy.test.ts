/**
 * pdf-routes-policy.test.ts — Test guardián de la regla CLAUDE.md #8.
 *
 * Hay dos tipos de rutas pdf/route.ts:
 *
 *  A) Generación directa (pdfkit): el servidor genera el PDF y lo envía.
 *     Debe devolver `Content-Type: application/pdf` con
 *     `Content-Disposition: inline`. NO usar HTML wrapper.
 *
 *  B) Redirección R2: el servidor devuelve JSON `{ url }` con URL firmada
 *     a un PDF que ya está en R2. El cliente navega a esa URL. Esta ruta
 *     no controla los headers del PDF — los controla el upload original.
 *     Detectado por importar `obtenerUrlFirmada` / `getSignedUrl`.
 *
 * Si este test falla:
 *  - Tipo A: probablemente la ruta devuelve HTML imprimible. Convertirla
 *    a pdfkit (ver src/lib/pdf-libro-iva.ts como ejemplo).
 *  - Tipo B: revisar si el upload a R2 setea Content-Disposition: inline.
 */
import * as fs from "fs"
import * as path from "path"

const API_ROOT = path.join(__dirname, "..", "app", "api")

function findPdfRoutes(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findPdfRoutes(full, acc)
    else if (entry.isFile() && entry.name === "route.ts" && full.includes(`${path.sep}pdf${path.sep}`)) {
      acc.push(full)
    }
  }
  return acc
}

const PDF_ROUTES = findPdfRoutes(API_ROOT)

// Violaciones conocidas que se migran en una tanda futura. Cada entrada lleva
// el path absoluto de la ruta + ticket interno. NO agregar nada acá sin abrir
// el ticket primero — la regla es no migrar (ver CLAUDE.md regla 8).
const VIOLACIONES_CONOCIDAS = new Set<string>([
  // Tanda 2: convertir a pdfkit con helpers nuevos
  path.join(API_ROOT, "contabilidad", "gastos", "pdf", "route.ts"),
  path.join(API_ROOT, "contabilidad", "iibb", "pdf", "route.ts"),
  path.join(API_ROOT, "contabilidad", "lp-vs-facturas", "pdf", "route.ts"),
])

function esRutaR2Redirect(content: string): boolean {
  return /obtenerUrlFirmada|getSignedUrl/.test(content)
}

const RUTAS_AUDITABLES = PDF_ROUTES.filter((file) => !VIOLACIONES_CONOCIDAS.has(file))
const RUTAS_DIRECTAS = RUTAS_AUDITABLES.filter((file) => !esRutaR2Redirect(fs.readFileSync(file, "utf-8")))
const RUTAS_R2 = RUTAS_AUDITABLES.filter((file) => esRutaR2Redirect(fs.readFileSync(file, "utf-8")))

describe("PDF API routes follow CLAUDE.md regla 8", () => {
  test("hay al menos una ruta PDF detectada (sanity check)", () => {
    expect(PDF_ROUTES.length).toBeGreaterThan(0)
  })

  describe("Generación directa (pdfkit)", () => {
    test.each(RUTAS_DIRECTAS)("%s devuelve Content-Type application/pdf", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      expect(content).toMatch(/["']Content-Type["']\s*:\s*["']application\/pdf/)
    })

    test.each(RUTAS_DIRECTAS)("%s usa Content-Disposition inline (no attachment)", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      expect(content).toMatch(/Content-Disposition[^"']*["']\s*:\s*[`"']inline/)
      expect(content).not.toMatch(/Content-Disposition[^"']*["']\s*:\s*[`"']attachment/)
    })

    test.each(RUTAS_DIRECTAS)("%s no devuelve text/html", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      expect(content).not.toMatch(/["']Content-Type["']\s*:\s*["']text\/html/)
    })

    test.each(RUTAS_DIRECTAS)("%s no genera HTML imprimible (anti-patrón)", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      expect(content).not.toMatch(/<!DOCTYPE/i)
      expect(content).not.toMatch(/window\.\s*onload\s*=\s*function/)
      expect(content).not.toMatch(/window\.print\(\)/)
    })

    test.each(RUTAS_DIRECTAS)("%s usa pdfkit directo o helper @/lib/pdf-*", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      const usaPdfkit = /from\s+["']pdfkit["']/.test(content)
      const usaHelper = /from\s+["']@\/lib\/pdf-[\w-]+["']/.test(content)
      expect(usaPdfkit || usaHelper).toBe(true)
    })
  })

  describe("Redirección R2 (signed URL)", () => {
    test.each(RUTAS_R2)("%s devuelve JSON con la URL", (file) => {
      const content = fs.readFileSync(file, "utf-8")
      expect(content).toMatch(/NextResponse\.json\(\s*\{\s*url/)
    })
  })
})
