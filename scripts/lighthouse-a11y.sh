#!/usr/bin/env bash
# Lighthouse accessibility score for the phone page (needs network for npx). Usage: bash scripts/lighthouse-a11y.sh [url]
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${1:-$(node -p "require('./config/endpoints.json').webUrl")/}"
export CHROME_PATH="$(node -p "require('@playwright/test').chromium.executablePath()")"
OUT="$(mktemp -d)"
(cd "$OUT" && npx -y lighthouse@12 "$URL" --only-categories=accessibility --quiet --output=json --output-path="$OUT/lh.json" \
  --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --screenEmulation.mobile --screenEmulation.width=390 --screenEmulation.height=844 >/dev/null 2>&1)
node -e '
const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const score = Math.round(r.categories.accessibility.score * 100);
const fails = Object.values(r.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "notApplicable" && a.scoreDisplayMode !== "manual").map((a) => a.id);
console.log(`Lighthouse accessibility ${score} for ${process.argv[2]}` + (fails.length ? ` (not perfect: ${fails.join(", ")})` : ""));
process.exit(score >= 95 ? 0 : 1);
' "$OUT/lh.json" "$URL"
