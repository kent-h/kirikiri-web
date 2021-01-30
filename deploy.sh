#!/bin/bash

if [[ -z "$1" ]]; then
  echo "Usage: $0 <bucket>"
  exit 1
fi
BUCKET="s3://$1"

npm run build

aws s3 sync build/ "$BUCKET" --exclude index.html --exclude service-worker.js \
  --cache-control "public,max-age=3600" \
  --storage-class INTELLIGENT_TIERING \
  --metadata-directive REPLACE
aws s3 cp build/service-worker.js "$BUCKET/service-worker.js" \
  --metadata-directive REPLACE \
  --cache-control no-cache
aws s3 cp build/index.html "$BUCKET/index.html" \
  --metadata-directive REPLACE \
  --cache-control no-cache
