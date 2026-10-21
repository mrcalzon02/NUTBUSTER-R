#!/usr/bin/env bash
# Re-register the EXISTING NUTBUSTER key only. Never create or replace a signing key.
# Never commit a keystore or password.
set -euo pipefail
umask 077
REPO="mrcalzon02/NUTBUSTER-R"
DEST="$HOME/.local/share/nutbuster-signing"
KEYSTORE="$DEST/nutbuster-publisher.p12"
PASSWORD_FILE="$DEST/store-password"
ALIAS="nutbuster"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PINNED="$(tr -d '[:space:]' < "$ROOT/config/nutbuster-publisher.sha256")"
[[ "$PINNED" =~ ^[0-9a-f]{64}$ ]] || { echo "Invalid NUTBUSTER pinned certificate" >&2; exit 1; }
for cmd in gh keytool base64 sha256sum; do
  command -v "$cmd" >/dev/null || { echo "Missing requirement: $cmd" >&2; exit 1; }
done
gh auth status >/dev/null
mkdir -p "$DEST"
chmod 700 "$DEST"
if [[ ! -f "$KEYSTORE" || ! -f "$PASSWORD_FILE" ]]; then
  echo "Original NUTBUSTER keystore or password missing at $DEST." >&2
  echo "Restore the existing key from your private backup. A new key will NOT be generated." >&2
  exit 1
fi
IFS= read -r PASSWORD < "$PASSWORD_FILE"
keytool -list -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$PASSWORD" >/dev/null
ACTUAL="$(keytool -exportcert -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$PASSWORD" 2>/dev/null | sha256sum | awk '{print $1}')"
if [[ "$ACTUAL" != "$PINNED" ]]; then
  echo "Wrong signing certificate: $ACTUAL. No secrets were changed." >&2
  exit 1
fi
base64 < "$KEYSTORE" | tr -d '\n' | gh secret set PHONE_TEST_KEYSTORE_BASE64 --repo "$REPO"
printf '%s' "$PASSWORD" | gh secret set PHONE_TEST_STORE_PASSWORD --repo "$REPO"
printf '%s' "$ALIAS" | gh secret set PHONE_TEST_KEY_ALIAS --repo "$REPO"
printf '%s' "$PASSWORD" | gh secret set PHONE_TEST_KEY_PASSWORD --repo "$REPO"
echo "NUTBUSTER signing secrets uploaded:"
gh secret list --repo "$REPO" | grep -E '^PHONE_TEST_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)[[:space:]]'
echo "Verified permanent NUTBUSTER publisher certificate SHA-256: $ACTUAL"
echo "Back up $KEYSTORE and $PASSWORD_FILE privately; losing these prevents future in-place updates."
