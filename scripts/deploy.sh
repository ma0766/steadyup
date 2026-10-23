#!/usr/bin/env bash
# Build phone pages, deploy stack, write committed endpoint config used by tests + Android build.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build -w web
cd server
npx cdk deploy --require-approval never --outputs-file ../cdk-outputs.json
cd ..
node scripts/write-config.mjs
