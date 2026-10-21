#!/usr/bin/env bash
# Run once on a trusted computer. Never commit a keystore or password.
set -euo pipefail
umask 077
REPO="mrcalzon02/NUTBUSTER-R"
DEST="$HOME/.local/share/nutbuster-signing"
KEYSTORE="$DEST/nutbuster-publisher.p12"
PASSWORD_FILE="$DEST/store-password"
ALIAS="nutbuster"
for cmd in gh keytool openssl base64; do
  command -v "$cmd" >/dev/null || { echo "Missing requirement: $cmd" >&2; exit 1; }
done
gh auth status >/dev/null
mkdir -p "$DEST"
chmod 700 "$DEST"
if [[ ! -f "$KEYSTORE" && ! -e "$PASSWORD_FILE" ]]; then
  PASSWORD="$(openssl rand -hex 32)"
  printf '%s\n' "$PASSWORD" > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
  keytool -genkeypair -noprompt -storetype PKCS12 -keystore "$KEYSTORE" \
    -alias "$ALIAS" -keyalg RSA -keysize 3072 -sigalg SHA256withRSA \
    -validity 10000 -dname "CN=NUTBUSTER,O=NUTBUSTER" \
    -storepass "$PASSWORD" -keypass "$PASSWORD"
  chmod 600 "$KEYSTORE"
elif [[ ! -f "$KEYSTORE" || ! -f "$PASSWORD_FILE" ]]; then
  echo "Partial signing identity at $DEST; refusing key replacement" >&2
  exit 1
fi
IFS= read -r PASSWORD < "$PASSWORD_FILE"
keytool -list -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$PASSWORD" >/dev/null
base64 < "$KEYSTORE" | tr -d '\n' | gh secret set PHONE_TEST_KEYSTORE_BASE64 --repo "$REPO"
printf '%s' "$PASSWORD" | gh secret set PHONE_TEST_STORE_PASSWORD --repo "$REPO"
printf '%s' "$ALIAS" | gh secret set PHONE_TEST_KEY_ALIAS --repo "$REPO"
printf '%s' "$PASSWORD" | gh secret set PHONE_TEST_KEY_PASSWORD --repo "$REPO"
echo "NUTBUSTER signing secrets uploaded:"
gh secret list --repo "$REPO" | grep -E '^PHONE_TEST_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)[[:space:]]'
keytool -exportcert -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$PASSWORD" \
  | sha256sum | awk '{print "NUTBUSTER publisher certificate SHA-256: "$1}'
echo "Back up $KEYSTORE and $PASSWORD_FILE privately; losing these prevents future in-place updates."
