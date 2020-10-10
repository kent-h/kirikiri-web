#!/bin/bash

set -eo pipefail

DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "$DIR/../public/game"

find . -type f -name '*.ks' -print0 | while IFS= read -r -d '' i; do
  echo -n "$i... "
  iconv -f UTF-16LE -t UTF-8 "$i" >tmp-file.txt
  cat tmp-file.txt >"$i"
  echo "OK"
done

rm tmp-file.txt