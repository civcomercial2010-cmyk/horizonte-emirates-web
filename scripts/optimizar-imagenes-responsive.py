"""Recomprime WebP existentes y genera variantes responsive (srcset).

Uso:
    python scripts/optimizar-imagenes-responsive.py

Dos modos por imagen, según se le pase `widths` o no:
  - Sin `widths`: recomprime en el mismo tamaño y ruta (mejora el factor de
    compresión sin tocar el HTML que la referencia).
  - Con `widths`: genera un archivo por ancho (sufijo `-{ancho}`) más un
    archivo en la ruta original con el ancho máximo de la lista (clamped al
    ancho real de la fuente, nunca hace upscale). Pensado para servir con
    `srcset` + `sizes` en el HTML.

Calidad fija en QUALITY (ver constante). No es un pipeline de build: se
ejecuta a mano cuando se añaden o cambian imágenes, y el resultado se
commitea como cualquier otro asset.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public"
QUALITY = 78
METHOD = 6  # 0=rápido/peor compresión, 6=lento/mejor compresión


def recompress(rel_path: str) -> None:
    path = ROOT / rel_path
    before = path.stat().st_size
    im = Image.open(path).convert("RGB")
    im.save(path, format="WEBP", quality=QUALITY, method=METHOD)
    after = path.stat().st_size
    pct = 100 * (before - after) / before
    print(f"{rel_path}: {before:,} -> {after:,} bytes ({pct:.0f}% menos)")


def responsive(rel_path: str, widths: list[int]) -> None:
    path = ROOT / rel_path
    before = path.stat().st_size
    im = Image.open(path).convert("RGB")
    src_w, src_h = im.size
    widths = sorted({min(w, src_w) for w in widths})
    total_after = 0
    for w in widths:
        h = round(src_h * w / src_w)
        variant = im if w == src_w else im.resize((w, h), Image.LANCZOS)
        is_max = w == widths[-1]
        out_path = path if is_max else path.with_name(f"{path.stem}-{w}{path.suffix}")
        variant.save(out_path, format="WEBP", quality=QUALITY, method=METHOD)
        size = out_path.stat().st_size
        total_after += size
        tag = "(reemplaza el original, sigue siendo el src= de fallback)" if is_max else ""
        print(f"  {out_path.relative_to(ROOT)}: {w}w -> {size:,} bytes {tag}")
    print(f"{rel_path}: original {before:,} bytes -> variantes {total_after:,} bytes en total")


if __name__ == "__main__":
    print("== Recompresión del hero de fondo (sin tocar el HTML) ==")
    for p in [
        "assets/img/hero-dubai-768.webp",
        "assets/img/hero-dubai-1280.webp",
        "assets/img/hero-dubai-1920.webp",
    ]:
        recompress(p)

    print("\n== Variantes responsive de las 3 tarjetas de propiedad destacada ==")
    for p in [
        "assets/projects/saas-hills-dubai/hero.webp",
        "assets/projects/binghatti-wraith-al-jaddaf/hero.webp",
        "assets/projects/nh-collection-rak/c01.webp",
    ]:
        responsive(p, [480, 800, 1150])
