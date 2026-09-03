#!/usr/bin/env python3
"""
Comprueba que el robots.txt que sirve produccion es el del repositorio.

Cloudflare puede inyectar su propio bloque gestionado por delante del archivo
(funcion "AI Crawl Control"). Cuando lo hace, produccion sirve reglas que
contradicen a las del repo y nadie se entera: el codigo no cambia.

Detectado el 31-ago-2026, cuando produccion servia Disallow: / para GPTBot,
ClaudeBot, Google-Extended y 6 bots mas, mientras el repo decia Allow: /.

Uso:
    python scripts/verificar-robots.py
    python scripts/verificar-robots.py --url https://otro-dominio.com

Devuelve 0 si coinciden, 1 si no. Apto para CI o hook de pre-deploy.
"""
import argparse
import pathlib
import sys
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LOCAL = RAIZ / "public" / "robots.txt"
URL = "https://www.horizonteemirates.com/robots.txt"

# Bots que la politica del proyecto quiere permitir para GEO.
BOTS_GEO = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User",
    "ClaudeBot", "Claude-User",
    "PerplexityBot", "Perplexity-User",
    "Google-Extended", "Applebot-Extended",
]

MARCADOR_CF = "BEGIN Cloudflare Managed content"


def descargar(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "verificar-robots/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "replace")


def grupos(texto: str) -> dict:
    """Devuelve {user-agent en minusculas: [reglas]} fusionando grupos repetidos."""
    fuera = {}
    actuales = []
    for linea in texto.splitlines():
        linea = linea.split("#")[0].strip()
        if not linea:
            continue
        if ":" not in linea:
            continue
        campo, valor = (x.strip() for x in linea.split(":", 1))
        campo = campo.lower()
        if campo == "user-agent":
            actuales.append(valor.lower())
            fuera.setdefault(valor.lower(), [])
        elif campo in ("allow", "disallow"):
            for ua in actuales:
                fuera[ua].append((campo, valor))
        else:
            actuales = [] if campo == "sitemap" else actuales
    return fuera


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    args = ap.parse_args()

    if not LOCAL.exists():
        print("ERROR: no existe %s" % LOCAL)
        return 1

    disco = LOCAL.read_text(encoding="utf-8")
    try:
        servido = descargar(args.url)
    except Exception as e:
        print("ERROR: no se pudo descargar %s (%s)" % (args.url, e))
        return 1

    print("robots.txt en disco:   %5d bytes" % len(disco.encode()))
    print("robots.txt servido:    %5d bytes" % len(servido.encode()))
    print()

    fallos = 0

    if MARCADOR_CF in servido:
        print("FALLO: Cloudflare esta inyectando su bloque gestionado.")
        print("       Panel > horizonteemirates.com > AI Crawl Control, desactivar")
        print("       el robots.txt gestionado.")
        fallos += 1

    if disco.strip() != servido.strip():
        print("FALLO: lo servido NO coincide con el repositorio.")
        fallos += 1
    else:
        print("OK: produccion sirve exactamente el archivo del repositorio.")

    # Comprobacion de intencion, no solo de bytes: los bots de GEO deben poder pasar.
    g = grupos(servido)
    bloqueados = []
    for bot in BOTS_GEO:
        reglas = g.get(bot.lower(), [])
        if any(c == "disallow" and v == "/" for c, v in reglas):
            permitido = any(c == "allow" and v == "/" for c, v in reglas)
            bloqueados.append(bot + (" (regla en conflicto)" if permitido else ""))
    if bloqueados:
        print()
        print("FALLO: estos rastreadores de IA estan bloqueados o en conflicto:")
        for b in bloqueados:
            print("       - " + b)
        fallos += 1
    else:
        print("OK: los %d rastreadores de IA de la politica pueden rastrear." % len(BOTS_GEO))

    if "content-signal" not in servido.lower():
        print()
        print("AVISO: no se declara Content-Signal. Ni concede ni restringe el uso")
        print("       por IA. Si era intencional, ignora este aviso.")

    print()
    print("RESULTADO: %s" % ("CORRECTO" if fallos == 0 else "%d fallo(s)" % fallos))
    return 0 if fallos == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
