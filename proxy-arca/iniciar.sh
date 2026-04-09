#!/bin/bash
# Inicia el proxy ARCA + Cloudflare Tunnel en una sola terminal.
# Uso: ./iniciar.sh

echo "=== Proxy ARCA para Transmagg ==="
echo ""

# Iniciar proxy Node en background
node /home/tobi/Desktop/transmagg26/proxy-arca/index.js &
PROXY_PID=$!
echo "Proxy iniciado (PID $PROXY_PID)"

# Esperar a que el proxy esté listo
sleep 1

# Iniciar túnel Cloudflare
echo "Iniciando túnel Cloudflare..."
echo ""
cloudflared tunnel --url http://localhost:3100 &
TUNNEL_PID=$!

# Esperar a que se muestre la URL
sleep 5
echo ""
echo "============================================"
echo "  Copiá la URL de trycloudflare.com"
echo "  y verificá que coincida con la de Vercel"
echo "============================================"
echo ""
echo "Presioná Ctrl+C para detener todo."

# Esperar y limpiar al cerrar
trap "kill $PROXY_PID $TUNNEL_PID 2>/dev/null; echo ''; echo 'Proxy detenido.'; exit 0" INT TERM
wait
