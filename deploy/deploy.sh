#!/usr/bin/env bash
# 사용법: ./deploy/deploy.sh <ssh-host>   (예: ubuntu@140.x.x.x, ~/.ssh/config 별칭 가능)
set -euo pipefail
HOST="${1:?ssh host 필요}"
npm run build
npm test
rsync -az --delete dist/ "${HOST}:/var/www/gift-annuity/"
echo "배포 완료: ${HOST}"
