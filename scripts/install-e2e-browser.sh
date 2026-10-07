#!/usr/bin/env bash
set -euo pipefail
version=149.0.7827.155
destination="${1:-$PWD/.cache/e2e-browser}"
mkdir -p "$destination"
for product in chrome chromedriver; do
  archive="$destination/$product.zip"
  curl --fail --silent --show-error --location --retry 3 \
    "https://storage.googleapis.com/chrome-for-testing-public/$version/linux64/$product-linux64.zip" -o "$archive"
done
(cd "$destination" && sha256sum --check <<'CHECKSUMS'
a2f5d96421757d864145bcf3e699c0a70df891ff35ac3f3f67e7d0e1d5eca01a  chrome.zip
55d58aa22dcc4eea90897fc58dd12fcb50788f0cefa1295d79117c48b2bf0707  chromedriver.zip
CHECKSUMS
)
unzip -q -o "$destination/chrome.zip" -d "$destination"
unzip -q -o "$destination/chromedriver.zip" -d "$destination"
chmod +x "$destination/chrome-linux64/chrome" "$destination/chrome-linux64/chrome_crashpad_handler" "$destination/chromedriver-linux64/chromedriver"
"$destination/chrome-linux64/chrome" --version
"$destination/chromedriver-linux64/chromedriver" --version
if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "CHROME_BINARY=$destination/chrome-linux64/chrome" >> "$GITHUB_ENV"
  echo "CHROMEDRIVER_BINARY=$destination/chromedriver-linux64/chromedriver" >> "$GITHUB_ENV"
fi
