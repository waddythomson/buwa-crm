#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

msg="${1:-Update}"
git add -A
git diff --staged --quiet && { echo "Nothing to commit."; exit 0; }
git commit -m "$msg"
git push
