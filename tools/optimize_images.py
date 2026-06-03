#!/usr/bin/env python3
"""
Optimiza imágenes pesadas (JPG/PNG) a WebP para la web de Horizonte Emirates.

- Redimensiona al ancho máximo indicado (manteniendo aspecto).
- Convierte a WebP con calidad/método configurables.
- Conserva los originales (no borra nada): genera un .webp junto a cada original.
- Ignora imágenes que ya son .webp.

Uso:
    python tools/optimize_images.py                 # procesa assets/projects/**
    python tools/optimize_images.py --max-width 1600 --quality 82
    python tools/optimize_images.py --dir "assets/projects/nh-collection-rak"
"""
import argparse
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTS = {".jpg", ".jpeg", ".png"}


def human(n: int) -> str:
    for unit in ("B", "KB", "MB"):
        if n < 1024 or unit == "MB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n/1024**(['B','KB','MB'].index(unit)):.1f} {unit}"
        n_kb = n
    return f"{n/1024/1024:.1f} MB"


def optimize(path: pathlib.Path, max_width: int, quality: int) -> tuple[int, int]:
    before = path.stat().st_size
    out = path.with_suffix(".webp")
    with Image.open(path) as im:
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        im = im.convert("RGBA" if has_alpha else "RGB")
        if im.width > max_width:
            ratio = max_width / im.width
            im = im.resize((max_width, round(im.height * ratio)), Image.LANCZOS)
        im.save(out, "WEBP", quality=quality, method=6)
    return before, out.stat().st_size


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="assets/projects", help="Directorio a procesar (relativo a la raíz)")
    ap.add_argument("--max-width", type=int, default=1600)
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--min-kb", type=int, default=400, help="Solo procesa originales mayores que esto")
    args = ap.parse_args()

    base = ROOT / args.dir
    targets = [p for p in base.rglob("*") if p.suffix.lower() in EXTS and p.stat().st_size > args.min_kb * 1024]
    if not targets:
        print("No hay imágenes que superen el umbral. Nada que hacer.")
        return

    total_before = total_after = 0
    for p in sorted(targets):
        before, after = optimize(p, args.max_width, args.quality)
        total_before += before
        total_after += after
        rel = p.relative_to(ROOT)
        print(f"  {before/1024/1024:6.1f} MB -> {after/1024:6.0f} KB   {rel.with_suffix('.webp')}")

    saved = total_before - total_after
    print(f"\nTotal: {total_before/1024/1024:.1f} MB -> {total_after/1024/1024:.2f} MB "
          f"(ahorro {saved/1024/1024:.1f} MB, -{saved/total_before*100:.0f}%)")
    print("Originales conservados. Recuerda actualizar las rutas .jpg/.png -> .webp en el HTML.")


if __name__ == "__main__":
    main()
