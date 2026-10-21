# This script NEVER creates or rotates keys. It copies the EXISTING ReverieVR
# signing values to NUTBUSTER-R via authenticated GitHub CLI (no secret output).
param(
    [Parameter(Mandatory=$true)][string]$ReverieRoot,
    [switch]$TriggerBuild
)
$ErrorActionPreference='Stop'
$Path=Join-Path $ReverieRoot '.local/reverievr-signing/github-secrets.txt'
if(-not (Test-Path -LiteralPath $Path)) { throw "Existing ReverieVR secret values not found at $Path" }
$Secrets=@{}
Get-Content -LiteralPath $Path | ForEach-Object {
    if($_ -match '^([A-Z][A-Z0-9_]+)=(.*)$') { $Secrets[$Matches[1]]=$Matches[2] }
}
$Required=@('PHONE_TEST_KEYSTORE_BASE64','PHONE_TEST_STORE_PASSWORD','PHONE_TEST_KEY_ALIAS','PHONE_TEST_KEY_PASSWORD')
foreach($k in $Required) { if(-not $Secrets.ContainsKey($k) -or [string]::IsNullOrEmpty($Secrets[$k])) {throw "ReverieVR secret file missing $k"} }
if(-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI is required. Install gh and run gh auth login.' }
& gh auth status | Out-Null
if($LASTEXITCODE -ne 0) { throw 'Authenticate GitHub CLI first: gh auth login' }
foreach($k in $Required) {
    $Secrets[$k] | & gh secret set $k --repo mrcalzon02/NUTBUSTER-R
    if($LASTEXITCODE -ne 0) { throw "GitHub rejected $k. Other values might be saved; retry after fixing permissions." }
}
Write-Host 'Copied existing ReverieVR signing identity to NUTBUSTER-R without generating a new key.'
if($TriggerBuild) {
    & gh workflow run build-and-release.yml --repo mrcalzon02/NUTBUSTER-R
    if($LASTEXITCODE -ne 0){ throw 'Secrets copied but workflow dispatch failed.' }
    Write-Host 'Requested a signed release build.'
}
