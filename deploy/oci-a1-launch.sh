#!/usr/bin/env bash
# Oracle Cloud Always Free — Ampere A1(ARM) 인스턴스 생성 재시도 스크립트
#
# A1.Flex는 무료 계정에서 "Out of host capacity" 오류로 생성이 자주 실패한다.
# 이 스크립트는 성공할 때까지(또는 수동 중단까지) 일정 간격으로 생성을 재시도한다.
# 가용 도메인(AD)이 여러 개인 리전이면 AD를 순환하며 시도한다.
#
# 사전 준비:
#   1. OCI CLI 설치 및 인증 설정: `oci setup config` (https://docs.oracle.com/iaas/tools/oci-cli)
#   2. 아래 환경변수를 채워서 실행하거나, 같은 디렉터리의 oci-a1.env 파일에 정의
#      (oci-a1.env가 있으면 자동으로 읽는다. OCID는 OCI 콘솔에서 복사)
#
# 사용법:
#   ./deploy/oci-a1-launch.sh
#   TRY_INTERVAL=120 ./deploy/oci-a1-launch.sh   # 재시도 간격 조정(초)
#
# 주의:
#   - 무료 한도: A1은 계정 전체 합산 4 OCPU / 24GB. 기존 A1 인스턴스가 있으면 그만큼 빼야 한다.
#   - 간격을 60초 미만으로 줄이지 말 것 — 429(TooManyRequests)로 오히려 느려진다.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
[ -f "${SCRIPT_DIR}/oci-a1.env" ] && source "${SCRIPT_DIR}/oci-a1.env"

# ── 필수 설정 ────────────────────────────────────────────────────────────────
: "${COMPARTMENT_OCID:?COMPARTMENT_OCID 필요 (콘솔: Identity → Compartments)}"
: "${SUBNET_OCID:?SUBNET_OCID 필요 (콘솔: Networking → VCN → Subnet)}"
: "${IMAGE_OCID:?IMAGE_OCID 필요 (aarch64 이미지 — 예: Ubuntu 24.04 Minimal aarch64)}"
: "${SSH_PUB_KEY_FILE:?SSH_PUB_KEY_FILE 필요 (예: ~/.ssh/id_ed25519.pub)}"

# ── 선택 설정(기본값) ─────────────────────────────────────────────────────────
DISPLAY_NAME="${DISPLAY_NAME:-gift-annuity-a1}"
OCPUS="${OCPUS:-4}"                 # 무료 최대 4
MEMORY_GB="${MEMORY_GB:-24}"        # 무료 최대 24
BOOT_VOLUME_GB="${BOOT_VOLUME_GB:-50}"
TRY_INTERVAL="${TRY_INTERVAL:-90}"  # 재시도 간격(초)
MAX_TRIES="${MAX_TRIES:-0}"         # 0 = 무제한

SSH_KEY_CONTENT="$(cat "${SSH_PUB_KEY_FILE/#\~/$HOME}")"

# AD 목록: AVAILABILITY_DOMAINS 환경변수(공백 구분)로 직접 지정 가능.
# 미지정 시 API 조회 — API 키 등록 직후 간헐 401이 있으므로 최대 10회 재시도.
ADS=()
if [ -n "${AVAILABILITY_DOMAINS:-}" ]; then
  # shellcheck disable=SC2206
  ADS=(${AVAILABILITY_DOMAINS})
else
  for _i in 1 2 3 4 5 6 7 8 9 10; do
    while IFS= read -r _ad; do
      [ -n "${_ad}" ] && ADS+=("${_ad}")
    done < <(oci iam availability-domain list \
      --compartment-id "${COMPARTMENT_OCID}" \
      --query 'data[].name' --raw-output 2>/dev/null \
      | python3 -c 'import sys,json; print("\n".join(json.load(sys.stdin)))' 2>/dev/null)
    [ "${#ADS[@]}" -gt 0 ] && break
    echo "AD 조회 실패 (${_i}/10) — 15초 후 재시도"
    sleep 15
  done
fi

if [ "${#ADS[@]}" -eq 0 ]; then
  echo "가용 도메인을 찾지 못했습니다. OCI CLI 인증을 확인하세요." >&2
  exit 1
fi

echo "== A1.Flex 생성 재시도 시작 =="
echo "   shape: VM.Standard.A1.Flex ${OCPUS}ocpu/${MEMORY_GB}GB, ADs: ${ADS[*]}"
echo "   간격: ${TRY_INTERVAL}s, 중단: Ctrl-C"

try=0
while :; do
  for AD in "${ADS[@]}"; do
    try=$((try + 1))
    ts="$(date '+%m-%d %H:%M:%S')"
    echo "[${ts}] 시도 #${try} (AD: ${AD}) ..."

    set +e
    OUT="$(oci compute instance launch \
      --compartment-id "${COMPARTMENT_OCID}" \
      --availability-domain "${AD}" \
      --shape "VM.Standard.A1.Flex" \
      --shape-config "{\"ocpus\": ${OCPUS}, \"memoryInGBs\": ${MEMORY_GB}}" \
      --image-id "${IMAGE_OCID}" \
      --subnet-id "${SUBNET_OCID}" \
      --assign-public-ip true \
      --display-name "${DISPLAY_NAME}" \
      --boot-volume-size-in-gbs "${BOOT_VOLUME_GB}" \
      --metadata "{\"ssh_authorized_keys\": \"${SSH_KEY_CONTENT}\"}" \
      2>&1)"
    RC=$?
    set -e

    if [ $RC -eq 0 ]; then
      INSTANCE_OCID="$(printf '%s' "$OUT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])')"
      echo ""
      echo "== 생성 성공! =="
      echo "   instance OCID: ${INSTANCE_OCID}"
      # 공인 IP 조회 (부팅 완료까지 약간 걸릴 수 있음)
      sleep 20
      oci compute instance list-vnics --instance-id "${INSTANCE_OCID}" \
        --query 'data[0]."public-ip"' --raw-output || true
      echo "   콘솔에서 확인 후: ssh ubuntu@<public-ip>"
      exit 0
    fi

    # 실패 사유 분류
    if grep -qi "Out of host capacity" <<< "$OUT"; then
      auth_fails=0
      echo "        용량 부족 (Out of host capacity) — 재시도 예정"
    elif grep -qi "TooManyRequests\|429" <<< "$OUT"; then
      echo "        API 레이트리밋(429) — 간격 2배로 대기"
      sleep "${TRY_INTERVAL}"
    elif grep -qi "LimitExceeded\|QuotaExceeded" <<< "$OUT"; then
      echo "== 무료 한도 초과 (LimitExceeded) — 재시도해도 소용없음. 기존 A1 자원을 확인하세요. ==" >&2
      exit 1
    elif grep -qi "NotAuthenticated\|NotAuthorized" <<< "$OUT"; then
      # API 키 등록 직후에는 간헐적 401이 발생하므로 연속 5회까지는 재시도
      auth_fails=$(( ${auth_fails:-0} + 1 ))
      if [ "${auth_fails}" -ge 5 ]; then
        echo "== 인증/권한 오류 연속 ${auth_fails}회 — oci 설정과 OCID를 확인하세요. ==" >&2
        printf '%s\n' "$OUT" >&2
        exit 1
      fi
      echo "        인증 오류(전파 지연 가능, ${auth_fails}/5) — 재시도 예정"
    else
      echo "        기타 오류 — 전문:"
      printf '%s\n' "$OUT" | head -5
    fi

    [ "${MAX_TRIES}" -gt 0 ] && [ "${try}" -ge "${MAX_TRIES}" ] && { echo "최대 시도 횟수 도달"; exit 1; }
    sleep "${TRY_INTERVAL}"
  done
done
