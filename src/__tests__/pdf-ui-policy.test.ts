/**
 * pdf-ui-policy.test.ts — Test guardián UI de la regla CLAUDE.md #8.
 *
 * Todo PDF se abre en la misma ventana del operador. Por lo tanto:
 *  - `<a href="...pdf">` NO usa `target="_blank"` ni `rel="noopener noreferrer"`
 *  - NO se llama `window.open(url, "_blank", ...)` en ninguna parte
 *
 * Si querés mostrar un PDF, usá:
 *  - `<a href={url}>Ver PDF</a>` (sin target)
 *  - `window.location.href = url` en handlers
 *
 * El visor PDF nativo del navegador le da al operador opciones de
 * guardar/imprimir; no hace falta abrir pestaña nueva ni HTML wrapper.
 */
import * as fs from "fs"
import * as path from "path"

const SRC_ROOTS = [
  path.join(__dirname, "..", "app"),
  path.join(__dirname, "..", "components"),
]

function listFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      listFiles(full, acc)
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      // Excluir tests
      if (full.includes(`${path.sep}__tests__${path.sep}`)) continue
      if (full.endsWith(".test.ts") || full.endsWith(".test.tsx")) continue
      acc.push(full)
    }
  }
  return acc
}

const ALL_FILES = SRC_ROOTS.flatMap((root) => listFiles(root))

describe("UI sigue regla PDF inline (CLAUDE.md regla 8)", () => {
  test("ningún archivo usa target=\"_blank\" en links de PDF", () => {
    const violaciones: { file: string; line: number; text: string }[] = []
    for (const file of ALL_FILES) {
      const lines = fs.readFileSync(file, "utf-8").split("\n")
      lines.forEach((line, i) => {
        if (/target=["']_blank["']/.test(line)) {
          violaciones.push({ file, line: i + 1, text: line.trim() })
        }
      })
    }
    if (violaciones.length > 0) {
      const msg = violaciones.map(v => `  ${v.file}:${v.line}\n    ${v.text}`).join("\n")
      throw new Error(`target="_blank" prohibido — usá <a href={url}> sin target:\n${msg}`)
    }
  })

  test("ningún archivo usa window.open(url, \"_blank\")", () => {
    const violaciones: { file: string; line: number; text: string }[] = []
    for (const file of ALL_FILES) {
      const lines = fs.readFileSync(file, "utf-8").split("\n")
      lines.forEach((line, i) => {
        if (/window\.open\s*\([^)]*["']_blank["']/.test(line)) {
          violaciones.push({ file, line: i + 1, text: line.trim() })
        }
      })
    }
    if (violaciones.length > 0) {
      const msg = violaciones.map(v => `  ${v.file}:${v.line}\n    ${v.text}`).join("\n")
      throw new Error(`window.open(..., "_blank") prohibido — usá window.location.href = url:\n${msg}`)
    }
  })
})
