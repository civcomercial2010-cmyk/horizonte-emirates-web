# Genera PDF de la guía fiscal (Chrome headless)
# Uso: .\scripts\generate-guia-fiscal-pdf.ps1 [-Version completa|ejecutiva|actual]

param(
    [ValidateSet('completa', 'ejecutiva', 'actual')]
    [string]$Version = 'completa',
    [int]$Port = 8899
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PublicRoot = Join-Path $Root 'public'

$map = @{
    'completa'  = @{
        Html = 'guias/guia-fiscal-dubai-espana-v2-completa.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana-v2-completa.pdf'
    }
    'ejecutiva' = @{
        Html = 'guias/guia-fiscal-dubai-espana-v2-ejecutiva.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana-v2-ejecutiva.pdf'
    }
    'actual'    = @{
        Html = 'guias/guia-fiscal-dubai-espana.html'
        Pdf  = 'public/guias/guia-fiscal-dubai-espana.pdf'
    }
}

$cfg = $map[$Version]
$htmlPath = Join-Path $PublicRoot ($cfg.Html -replace '/', '\')
$pdfPath  = Join-Path $Root ($cfg.Pdf -replace '/', '\')

if (-not (Test-Path $htmlPath)) {
    Write-Error "No existe: $htmlPath"
}

# La guía usa rutas absolutas (/assets/css/tokens.css, /assets/logos/...) porque en
# producción se sirve desde la raíz del sitio. Abrirla con file:// (como hacía este script
# antes) las resuelve contra la raíz del disco y el PDF sale sin tipografía de marca, sin
# logo y sin colores. Se sirve un HTTP local efímero desde public/ para que esas rutas
# resuelvan igual que en producción.
Write-Host "Levantando servidor local en el puerto $Port..."
$serverJob = Start-Job -ScriptBlock {
    param($dir, $port)
    Set-Location $dir
    python -m http.server $port --bind 127.0.0.1
} -ArgumentList $PublicRoot, $Port

$deadline = (Get-Date).AddSeconds(6)
$ready = $false
while (-not $ready -and (Get-Date) -lt $deadline) {
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 1 | Out-Null
        $ready = $true
    } catch {
        Start-Sleep -Milliseconds 300
    }
}
if (-not $ready) {
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Error "No se pudo levantar el servidor local en el puerto $Port (¿python no está en PATH?)."
}

$htmlUri = "http://127.0.0.1:$Port/$($cfg.Html)"

try {
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

    Write-Host "Generando PDF ($Version)..."
    Write-Host "  HTML: $htmlUri"
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
} finally {
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
}
