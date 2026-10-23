#!/usr/bin/env bash
# Build phone pages, deploy the stack, write config/endpoints.json (read by tests and the Android build).
# STAGE=wc npm run deploy  -> deploys a separate stack SteadyUp-wc; without STAGE it deploys the main SteadyUp stack.
set -euo pipefail
cd "$(dirname "$0")/.."
STACK="SteadyUp${STAGE:+-$STAGE}"
npm run build -w web
cd server
npx cdk deploy "$STACK" ${STAGE:+-c stage=$STAGE} --require-approval never --outputs-file ../cdk-outputs.json
cd ..
node scripts/write-config.mjs "$STACK"
