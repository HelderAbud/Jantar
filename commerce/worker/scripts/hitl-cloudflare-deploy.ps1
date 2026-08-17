# HITL: API token Cloudflare + KV + secrets + deploy. Nao cole tokens no chat.
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\hitl-cloudflare-deploy.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$env:NODE_OPTIONS = '--use-system-ca'
if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "OAuth (wrangler login) falha neste PC: Autorizar redireciona para localhost:8976 e a pagina nao carrega."
  Write-Host "Crie um token: https://dash.cloudflare.com/profile/api-tokens  (template Edit Cloudflare Workers)"
  $secure = Read-Host "Cole o API Token (nao aparece no ecran)" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $env:CLOUDFLARE_API_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

Write-Host "1) Conta..."
npx wrangler whoami
if ($LASTEXITCODE -ne 0) { throw "wrangler whoami falhou — token invalido ou NODE_OPTIONS" }

Write-Host "2) Namespace KV ORDERS..."
npx wrangler kv namespace create ORDERS
Write-Host "Cole o id em wrangler.toml ([[kv_namespaces]] binding=ORDERS) e rode de novo so o deploy se precisar."

Write-Host "3) Secrets (colar no prompt do wrangler, nao no Cursor):"
Write-Host "   MP_ACCESS_TOKEN = Access Token de PRODUCAO (nao TEST-)"
npx wrangler secret put MP_ACCESS_TOKEN
Write-Host "   PRO_TOKEN = mesmo valor de BRAND.proTokens (JL-PRO-DEMO no MVP)"
npx wrangler secret put PRO_TOKEN

Write-Host "4) Deploy..."
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { throw "wrangler deploy falhou" }

Write-Host "Pronto. Copie a URL *.workers.dev para index.html (checkoutApiPublic) e wrangler.toml (MP_NOTIFICATION_URL), depois: npx wrangler deploy"
Write-Host "Health: GET https://<worker>/health  → ok:true kv:true"
