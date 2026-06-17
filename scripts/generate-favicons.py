"""Genera favicon.ico y PNGs desde favicon.svg (requiere: npm install sharp)."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "public/assets/logos/horizonte-emirates/favicon.svg"
OUT = ROOT / "public"

NODE = r"""
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const svg = fs.readFileSync(process.argv[1]);
const out = process.argv[2];
const sizes = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['assets/logos/horizonte-emirates/favicon-512.png', 512],
];
(async () => {
  for (const [name, size] of sizes) {
    const p = path.join(out, name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    await sharp(svg).resize(size, size).png().toFile(p);
  }
})();
"""

def main():
    subprocess.check_call(
        ["node", "-e", NODE, str(SVG), str(OUT)],
        cwd=ROOT,
    )
    from PIL import Image

    i16 = Image.open(OUT / "favicon-16x16.png").convert("RGBA")
    i32 = Image.open(OUT / "favicon-32x32.png").convert("RGBA")
    i32.save(OUT / "favicon.ico", format="ICO", sizes=[(32, 32), (16, 16)], append_images=[i16])
    print("favicons generated in public/")

if __name__ == "__main__":
    main()
