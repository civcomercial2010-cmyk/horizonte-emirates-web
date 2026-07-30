#!/usr/bin/env python3
"""
Monta la version movil del generador de correos.

Toma la logica (bloque <script>) de tools/generador-mails.html, que es donde viven
los copys, y la inyecta en la maqueta tools/_plantilla-movil.html. Asi solo hay una
fuente de texto: si se edita un correo en el generador de escritorio, basta con
volver a ejecutar este script y republicar.

    python scripts/build_generador_movil.py

Genera dos salidas con el mismo contenido y distinto envoltorio:

  tools/generador-mails.movil.html
      Sin <html>/<head>/<body>. Para publicar como pagina privada, que ya
      aporta su propio documento.

  tools/generador-mails.appsscript.html
      Documento HTML completo con DOCTYPE, viewport y <base target="_top">.
      Para pegar en el archivo HTML "generador" del proyecto de Apps Script.
      Sin DOCTYPE el navegador entra en quirks mode y en el movil se ignora
      el viewport, que es la causa habitual de que la web app se vea rota.
"""

import io
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "tools", "generador-mails.html")
MAQUETA = os.path.join(RAIZ, "tools", "_plantilla-movil.html")
DESTINO = os.path.join(RAIZ, "tools", "generador-mails.movil.html")
DESTINO_GAS = os.path.join(RAIZ, "tools", "generador-mails.appsscript.html")

MARCADOR = "/* LOGICA_COMPARTIDA"

# Envoltorio para Apps Script. El DOCTYPE evita quirks mode (sin el, el movil
# ignora el viewport). <base target="_top"> saca los enlaces del iframe en el
# que Apps Script sirve la pagina.
CABECERA_GAS = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<base target="_top"/>
</head>
<body>
"""
PIE_GAS = """
</body>
</html>
"""


def leer(ruta):
    with io.open(ruta, encoding="utf-8") as f:
        return f.read()


def main():
    for ruta in (ORIGEN, MAQUETA):
        if not os.path.exists(ruta):
            sys.exit("No se encuentra: " + ruta)

    origen = leer(ORIGEN)
    bloques = re.findall(r"<script>(.*?)</script>", origen, re.S)
    if not bloques:
        sys.exit("No hay bloque <script> en " + ORIGEN)
    logica = max(bloques, key=len).strip()

    maqueta = leer(MAQUETA)
    if MARCADOR not in maqueta:
        sys.exit("La maqueta no tiene el marcador " + MARCADOR)

    # Sustituye el comentario marcador (y solo ese) por la logica completa.
    salida = re.sub(
        r"/\* LOGICA_COMPARTIDA.*?\*/",
        lambda _: logica,
        maqueta,
        count=1,
        flags=re.S,
    )

    with io.open(DESTINO, "w", encoding="utf-8") as f:
        f.write(salida)

    # El titulo va en el <head> en la version de Apps Script, no suelto en el cuerpo.
    cuerpo = re.sub(r"<title>(.*?)</title>\s*", "", salida, count=1, flags=re.S)
    titulo = re.search(r"<title>(.*?)</title>", salida, re.S)
    cabecera = CABECERA_GAS
    if titulo:
        cabecera = cabecera.replace(
            "<base target=\"_top\"/>",
            "<title>%s</title>\n<base target=\"_top\"/>" % titulo.group(1).strip(),
        )
    with io.open(DESTINO_GAS, "w", encoding="utf-8") as f:
        f.write(cabecera + cuerpo.strip() + PIE_GAS)

    rayas = salida.count("—")
    print("OK -> " + os.path.relpath(DESTINO, RAIZ) + "   (pagina publicada)")
    print("OK -> " + os.path.relpath(DESTINO_GAS, RAIZ) + "   (Apps Script)")
    print("   logica inyectada: %d caracteres" % len(logica))
    print("   rayas largas: %d (debe ser 0)" % rayas)
    faltan = [i for i in ("outSubject", "outBody", "tierBadge", "playbook", "warnConsent")
              if 'id="%s"' % i not in salida]
    if faltan:
        print("   AVISO: faltan identificadores en la maqueta: " + ", ".join(faltan))


if __name__ == "__main__":
    main()
