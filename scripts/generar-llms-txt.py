#!/usr/bin/env python3
"""
Genera public/llms.txt leyendo los title y meta description reales del HTML.

llms.txt es el indice legible por maquina que consultan los buscadores de IA
(ChatGPT, Perplexity, Claude) para entender de que va un sitio sin tener que
rastrearlo entero. Se escribe igual que el sitemap: desde la realidad del
codigo, no a mano, para que no envejezca.

Requisito previo: que el robots.txt servido permita de verdad a los bots de IA.
Comprobar con  python scripts/verificar-robots.py  antes de dar esto por util.

Uso:
    python scripts/generar-llms-txt.py
    python scripts/generar-llms-txt.py --check
"""
import argparse
import html as htmlmod
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = RAIZ / "public"
SALIDA = PUBLIC / "llms.txt"
BASE = "https://www.horizonteemirates.com"

CABECERA = """# Horizonte Emirates

> Generación de leads para inversión inmobiliaria en Emiratos Árabes Unidos,
> dirigida a inversores hispanohablantes de España y Latinoamérica. Operado por
> Propulse SLU (Andorra). El cierre de la operación lo ejecuta un partner con
> licencia RERA en Dubái.

Qué encontrarás aquí: guías sobre rentabilidad real, fiscalidad española de un
inmueble en Emiratos, residencia y Golden Visa, compra sobre plano y selección
de promociones en Dubái, Abu Dabi y Ras Al Khaimah.

Qué no es: no es una agencia inmobiliaria, no presta asesoramiento fiscal ni
jurídico, y no publica datos comerciales sin material oficial del promotor. Las
rentabilidades se expresan siempre como brutas, sin impuestos locales.

Uso del contenido: se permite citarlo e indexarlo, incluso como fuente en
respuestas generativas. No se permite su uso para entrenar modelos
(Content-Signal: search=yes, ai-input=yes, ai-train=no). Al citar, enlaza la URL
de origen.
"""

RE_NOINDEX = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)
RE_TITLE = re.compile(r"<title>(.*?)</title>", re.S)
RE_DESC = re.compile(r'<meta name="description" content="([^"]*)"')

# (titulo de seccion, funcion que decide si una url pertenece)
SECCIONES = [
    ("Páginas principales", lambda u: u in ("/", "/proyectos.html", "/blog/")),
    ("Guías de inversión", lambda u: u.startswith("/blog/") and any(
        k in u for k in ("invertir", "rentabilidad", "zonas", "sobre-plano", "comprar-propiedad", "espana-vs"))),
    ("Fiscalidad y residencia", lambda u: u.startswith("/blog/") and any(
        k in u for k in ("impuesto", "modelo-720", "residencia", "golden-visa"))),
    ("Vivir y operar en Emiratos", lambda u: u.startswith("/blog/") and any(
        k in u for k in ("vivir", "empresa", "free-zones"))),
    ("Legal", lambda u: u == "/legal.html"),
]


def limpiar(t: str) -> str:
    return re.sub(r"\s+", " ", htmlmod.unescape(t)).strip()


def recolectar():
    paginas = {}
    for ruta in sorted(PUBLIC.rglob("*.html")):
        doc = ruta.read_text(encoding="utf-8", errors="replace")
        if RE_NOINDEX.search(doc):
            continue
        rel = "/" + ruta.relative_to(PUBLIC).as_posix()
        if rel == "/index.html":
            rel = "/"
        elif rel.endswith("/index.html"):
            rel = rel[: -len("index.html")]
        mt, md = RE_TITLE.search(doc), RE_DESC.search(doc)
        if not mt:
            continue
        titulo = limpiar(mt.group(1)).split(" | ")[0]
        desc = limpiar(md.group(1)) if md else ""
        paginas[rel] = (titulo, desc)
    return paginas


def construir(paginas) -> str:
    partes = [CABECERA]
    usadas = set()
    for nombre, pertenece in SECCIONES:
        filas = [(u, v) for u, v in sorted(paginas.items())
                 if u not in usadas and pertenece(u)]
        if not filas:
            continue
        partes.append("\n## %s\n" % nombre)
        for url, (titulo, desc) in filas:
            usadas.add(url)
            partes.append("- [%s](%s%s)%s" % (titulo, BASE, url, ": " + desc if desc else ""))
        partes.append("")
    sobran = [(u, v) for u, v in sorted(paginas.items()) if u not in usadas]
    if sobran:
        partes.append("\n## Otras paginas\n")
        for url, (titulo, desc) in sobran:
            partes.append("- [%s](%s%s)%s" % (titulo, BASE, url, ": " + desc if desc else ""))
        partes.append("")
    return "\n".join(partes).rstrip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    paginas = recolectar()
    nuevo = construir(paginas)
    actual = SALIDA.read_text(encoding="utf-8") if SALIDA.exists() else ""

    print("Paginas indexadas en llms.txt: %d" % len(paginas))
    if nuevo == actual:
        print("Ya esta al dia.")
        return 0
    if args.check:
        print("NO esta al dia. Ejecuta: python scripts/generar-llms-txt.py")
        return 1
    SALIDA.write_text(nuevo, encoding="utf-8", newline="\n")
    print("Escrito %s (%d bytes)" % (SALIDA, len(nuevo.encode())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
