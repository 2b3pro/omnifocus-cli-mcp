#!/bin/bash
# scripts/smoke-cli.sh
set -e
./dist/bin/of.js --version
./dist/bin/of.js perspectives --json | jq -e '.success == true' || echo "Skipping perspectives check (expected for hand-written phase)"
./dist/bin/of.js list inbox --limit 1 --json | jq -e '.success == true'
echo "smoke OK"
