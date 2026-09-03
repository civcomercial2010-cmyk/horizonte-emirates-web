#!/usr/bin/env python3
"""
Genera public/sitemap.xml recorriendo public/ y leyendo la realidad, no una
lista escrita a mano.

- Excluye toda pagina con meta robots noindex (los lead magnets, las maquetas
  preview, inversion-fraccionada, creditos y la 404 salen solas).
- lastmod = fecha del ultimo commit que toco cada archivo. Si el archivo no
  esta en git todavia, usa su mtime.
- priority y changefreq por tipo de pagina, no inventados por archivo.
- Normaliza /index.html a / y /blog/index.html a /blog/, que es lo que dicen
  los canonical.

SEO_ESTRATEGIA.md ya avisaba de que el sitemap estatico se desactualizaria.
El 31-ago-2026 llevaba todo en lastmod 2026-06-07 con paginas tocadas el 24 de
agosto. Este script cierra eso.

Uso:
    python scripts/generar-sitemap.py            # escribe public/sitemap.xml
    python scripts/generar-sitemap.py --check    # solo comprueba, no escribe
"""
import argparse
import datetime
import pathlib
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
SALIDA = PUBLIC / "sitemap.xml"
BASE = "https://www.horizonteemirates.com"

# (patron de ruta, priority, changefreq). Primero que casa, gana.
REGLAS = [
    (r"^/$",              "1.0", "weekly"),
    (r"^/proyectos\.html$", "0.9", "weekly"),
    (r"^/blog/$",         "0.9", "weekly"),
    (r"^/blog/",          "0.8", "monthly"),
    (r"^/legal\.html$",   "0.3", "monthly"),
]
POR_DEFECTO = ("0.7", "monthly")

RE_NOINDEX = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex',
                        re.I)


def url_de(ruta: pathlib.Path) -> str:
    rel = "/" + ruta.relative_to(PUBLIC).as_posix()
    if rel == "/index.html":
        return "/"
    if rel.endswith("/index.html"):
        return rel[: -len("index.html")]
    return rel


def _sin_commitear() -> set:
    """Archivos con cambios en el arbol de trabajo o en el indice.

    Sin esto el sitemap mentiria: git log devuelve la fecha del ultimo commit,
    asi que un archivo editado hoy y aun sin commitear saldria con la fecha
    anterior. Para esos usamos la de hoy.
    """
    try:
        r = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"],
                           cwd=RAIZ, capture_output=True, text=True, timeout=15)
        fuera = set()
        for linea in r.stdout.splitlines():
            if len(linea) > 3:
                fuera.add((RAIZ / linea[3:].strip().strip('"')).resolve())
        return fuera
    except Exception:
        return set()


SUCIOS = _sin_commitear()


def lastmod(ruta: pathlib.Path) -> str:
    if ruta.resolve() in SUCIOS:
        return datetime.date.today().isoformat()
    try:
        r = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(ruta.relative_to(RAIZ))],
            cwd=RAIZ, capture_output=True, text=True, timeout=15,
        )
        fecha = r.stdout.strip()
        if fecha:
            return fecha
    except Exception:
        pass
    return datetime.date.fromtimestamp(ruta.stat().st_mtime).isoformat()


def prioridad(url: str):
    for patron, pri, freq in REGLAS:
        if re.search(patron, url):
            return pri, freq
    return POR_DEFECTO


def recolectar():
    paginas = []
    for ruta in sorted(PUBLIC.rglob("*.html")):
        html = ruta.read_text(encoding="utf-8", errors="replace")
        if RE_NOINDEX.search(html):
            continue
        url = url_de(ruta)
        pri, freq = prioridad(url)
        paginas.append((BASE + url, lastmod(ruta), freq, pri))
    # Home primero, luego por prioridad descendente y alfabetico
    paginas.sort(key=lambda p: (-float(p[3]), p[0]))
    return paginas


def construir(paginas) -> str:
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, mod, freq, pri in paginas:
        out += ["  <url>",
                "    <loc>%s</loc>" % loc,
                "    <lastmod>%s</lastmod>" % mod,
                "    <changefreq>%s</changefreq>" % freq,
                "    <priority>%s</priority>" % pri,
                "  </url>"]
    out.append("</urlset>")
    return "\n".join(out) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="no escribe, solo dice si el sitemap esta al dia")
    args = ap.parse_args()

    paginas = recolectar()
    nuevo = construir(paginas)
    actual = SALIDA.read_text(encoding="utf-8") if SALIDA.exists() else ""

    print("Paginas indexables encontradas: %d" % len(paginas))
    for loc, mod, freq, pri in paginas:
        print("  %s  %s  %s" % (mod, pri, loc.replace(BASE, "")))

    if nuevo == actual:
        print("\nEl sitemap ya esta al dia.")
        return 0

    if args.check:
        print("\nEl sitemap NO esta al dia. Ejecuta: python scripts/generar-sitemap.py")
        return 1

    SALIDA.write_text(nuevo, encoding="utf-8", newline="\n")
    print("\nEscrito %s" % SALIDA)
    return 0


if __name__ == "__main__":
    sys.exit(main())
