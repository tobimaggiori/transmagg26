---
name: Commits siempre en main
description: Los commits deben hacerse directamente en main, no en branches separadas. El deploy de Vercel es desde main.
type: feedback
---

Siempre commitear y pushear directamente a `main`. No crear branches separadas salvo que el usuario lo pida explícitamente.

**Why:** El deploy de Vercel es desde main. Pushear a otra branch no deploya nada y hace perder tiempo.

**How to apply:** Cuando el usuario pide commitear y pushear, hacerlo en la branch actual (main). Si el usuario menciona una branch específica en su instrucción, interpretarlo como el nombre del commit o ignorarlo — el destino sigue siendo main.
