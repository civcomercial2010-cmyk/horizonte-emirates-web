import re
from pathlib import Path

BLOCK = """<link rel="icon" href="/favicon.ico" sizes="48x48"/>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<link rel="icon" type="image/svg+xml" href="/assets/logos/horizonte-emirates/favicon.svg"/>"""

pat = re.compile(
    r'<link rel="icon"[^>]*href="(?:\.\./|/)?assets/logos/horizonte-emirates/favicon\.svg"[^>]*/>\s*',
    re.I,
)
count = 0
for path in Path("public").rglob("*.html"):
    text = path.read_text(encoding="utf-8")
    new, n = pat.subn(BLOCK + "\n", text, count=1)
    if n:
        path.write_text(new, encoding="utf-8")
        count += 1
        print(path)
print("updated", count, "files")
