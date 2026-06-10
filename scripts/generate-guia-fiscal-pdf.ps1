# Genera PDF de la guía fiscal (Chrome headless)
# Uso: .\scripts\generate-guia-fiscal-pdf.ps1 [-Version completa|ejecutiva|actual]

param(
    [ValidateSet('completa', 'ejecutiva', 'actual')]
    [string]$Version = 'completa'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$map = @{
    'completa'  = @{
        Html = 'public/guias/guia-fiscal-dubai-espana-v2-completa.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana-v2-completa.pdf'
    }
    'ejecutiva' = @{
        Html = 'public/guias/guia-fiscal-dubai-espana-v2-ejecutiva.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana-v2-ejecutiva.pdf'
    }
    'actual'    = @{
        Html = 'public/guias/guia-fiscal-dubai-espana.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana.pdf'
    }
}

$cfg = $map[$Version]
$htmlPath = Join-Path $Root ($cfg.Html -replace '/', '\')
$pdfPath  = Join-Path $Root ($cfg.Pdf -replace '/', '\')
$htmlUri  = [Uri]::new($htmlPath).AbsoluteUri

# Buscar Chrome / Edge
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
    Write-Error "No se encontró Chrome ni Edge. Instala Chrome o abre la guía y usa Ctrl+P > Guardar como PDF."
}

if (-not (Test-Path $htmlPath)) {
    Write-Error "No existe: $htmlPath"
}

Write-Host "Generando PDF ($Version)..."
Write-Host "  HTML: $htmlPath"
Write-Host "  PDF:  $pdfPath"

& $browser `
    --headless=new `
    --disable-gpu `
    --no-pdf-header-footer `
    --print-to-pdf="$pdfPath" `
    "$htmlUri"

# Chrome escribe el PDF de forma asíncrona
$deadline = (Get-Date).AddSeconds(8)
while (-not (Test-Path $pdfPath) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 300
}

if (Test-Path $pdfPath) {
    $size = (Get-Item $pdfPath).Length / 1KB
    Write-Host "OK: $pdfPath ($([math]::Round($size, 1)) KB)"
} else {
    Write-Error "No se generó el PDF."
}
