# leecoach-front — 유기정기금 증여계약서·평가명세서 PDF 생성 (프론트엔드)

> 프론트엔드 전용 레포. 향후 백엔드는 별도 레포(leecoach-back 등)로 분리 예정.

**일괄 생성기**: 미성년 자녀에게 정기 현금증여(유기정기금)를 할 때 필요한 두 서류를 웹에서 작성하고 PDF로 내려받아 홈택스 증여세 신고 시 증빙으로 바로 첨부할 수 있습니다.

1. 유기정기금 현금증여계약서 (도장 자동 생성 포함)
2. 유기정기금 평가명세서 (연도별 할인평가 표 + 근거 조문)

**설계·계획 문서**: [설계](docs/superpowers/specs/2026-07-30-gift-annuity-pdf-design.md) | [계획](docs/superpowers/plans/2026-07-30-gift-annuity-pdf.md)

## 개발

### 환경 설정
```bash
npm install
```

### 로컬 개발 서버
```bash
npm run dev
```
http://localhost:5173 에서 확인합니다.

### 테스트
```bash
npm test
```

### 프로덕션 빌드
```bash
npm run build
```
결과물은 `dist/` 디렉터리에 생성됩니다.

## 배포 (현행: Cloudflare Pages)

**운영 URL**: https://leecoachmom.com (+ https://www.leecoachmom.com, https://leecoach-front.pages.dev)

- **호스팅**: Cloudflare Pages 무료 플랜 (대역폭 무제한, DDoS 방어, 자동 HTTPS)
- **자동 배포**: `master` 브랜치에 push하면 Cloudflare가 자동으로 빌드·배포한다. 별도 배포 명령 없음.
  - 빌드 설정: 명령 `npm run build`, 출력 디렉터리 `dist` (프로젝트: Workers & Pages → `leecoach-front`)
  - 배포 확인: push 후 1~2분 내 반영. 번들 해시 변경으로 확인 가능.
- **도메인**: `leecoachmom.com` — 가비아에서 구매(2026-07-30), 네임서버는 Cloudflare로 위임
  - 네임서버: `hasslo.ns.cloudflare.com`, `ursula.ns.cloudflare.com` (가비아 관리 콘솔에 설정됨)
  - DNS/존 관리: Cloudflare 대시보드 (계정: joker10421@gmail.com) → leecoachmom.com 존
  - 루트·www 모두 Pages 프로젝트에 커스텀 도메인으로 연결됨 (CNAME → leecoach-front.pages.dev)
  - 서브도메인 추가(예: 향후 백엔드 `api.leecoachmom.com`)는 Cloudflare DNS에서 레코드만 추가하면 됨
- **GitHub 연동**: Cloudflare Workers & Pages GitHub App이 `leecoach-front` 레포 1개에만 설치됨

### (보류) Oracle Cloud 자체 호스팅

아래는 향후 백엔드 서버가 필요해질 때를 위한 참고. 현 프론트엔드 배포에는 사용하지 않는다.

> **현 계정 상태(2026-07-30)**: 테넌시(zarsealin, ap-chuncheon-1)의 **A1 한도가 0**이라
> ARM 인스턴스 생성이 불가능하다(`NotAuthorizedOrNotFound`). PAYG 업그레이드 없이는
> `VM.Standard.E2.1.Micro`(x86, 1GB)만 생성 가능. OCI CLI 인증은 구성되어 있음(`~/.oci/config`).

#### 1. Oracle Cloud Always Free 인스턴스 생성
- **1순위 — Ampere A1(ARM, 무료 최대 2 OCPU/12GB — 2026-06-15부터 반감)**: 용량 부족("Out of host capacity")으로 콘솔에서는
  생성이 자주 실패한다. 자동 재시도 스크립트를 사용:
  ```bash
  cp deploy/oci-a1.env.example deploy/oci-a1.env   # OCID·SSH 키 채우기 (커밋 금지)
  ./deploy/oci-a1-launch.sh                        # 성공할 때까지 90초 간격 재시도
  ```
  OCI CLI 설치·인증(`oci setup config`)이 선행되어야 하며, 이미지에는 **aarch64** 빌드를 지정한다.
- **대안 — VM.Standard.E2.1.Micro (x86, 1GB RAM)**: A1이 계속 안 잡힐 때. 정적 서빙만 하므로
  저사양으로도 충분(nginx 상주 10~20MB).
- **이미지**: Ubuntu 22.04/24.04 LTS (A1이면 aarch64, E2면 x86_64)
- **네트워크**: 공개 IP 할당

#### 2. 보안 규칙 설정
인스턴스의 VCN 보안 목록에 다음 규칙 추가:
- **HTTP**: 포트 80, CIDR 0.0.0.0/0 (Ingress)
- **HTTPS**: 포트 443, CIDR 0.0.0.0/0 (Ingress)

#### 3. 인스턴스 접속 및 패키지 설치
```bash
ssh ubuntu@<PUBLIC_IP_OR_HOSTNAME>

# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# nginx 및 Let's Encrypt 설치
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 4. 배포 대상 디렉터리 생성
로컬 머신에서 다음 명령으로 배포 대상 디렉터리를 생성합니다 (rsync이 쓸 수 있도록 ssh 사용자 소유로 설정):
```bash
ssh ubuntu@<HOST> 'sudo mkdir -p /var/www/gift-annuity && sudo chown $(whoami) /var/www/gift-annuity'
```

#### 5. nginx 설정 배포
로컬 머신에서 다음 명령으로 설정을 서버에 복사합니다:
```bash
scp deploy/nginx.conf ubuntu@<HOST>:/tmp/
ssh ubuntu@<HOST> 'sudo mv /tmp/nginx.conf /etc/nginx/sites-available/gift-annuity'
ssh ubuntu@<HOST> 'sudo ln -sf /etc/nginx/sites-available/gift-annuity /etc/nginx/sites-enabled/'
ssh ubuntu@<HOST> 'sudo rm -f /etc/nginx/sites-enabled/default'
ssh ubuntu@<HOST> 'sudo systemctl restart nginx'
```

#### 6. 도메인 설정
- 도메인 A 레코드를 인스턴스의 공개 IP로 가리킵니다.
- `deploy/nginx.conf`의 `server_name _;`을 실제 도메인으로 변경합니다.

#### 7. HTTPS 설정 (Let's Encrypt)
```bash
sudo certbot --nginx -d <yourdomain.com>
```
- 이메일 입력
- 약관 동의
- certbot이 nginx 설정 자동 수정

### 정기 배포

배포할 때마다 다음 명령을 실행합니다:
```bash
./deploy/deploy.sh ubuntu@<PUBLIC_IP_OR_HOSTNAME>
```

또는 ~/.ssh/config에 호스트 별칭을 설정한 경우:
```bash
./deploy/deploy.sh gift-annuity-server
```

**동작**:
1. `npm run build` 실행
2. `npm test` 실행으로 테스트 통과 확인
3. `dist/` 디렉터리를 서버의 `/var/www/gift-annuity/`로 동기화
4. 배포 완료 메시지 출력

## 보안 및 개인정보

- **클라이언트 사이드 처리**: 모든 계산과 PDF 생성은 사용자의 브라우저에서 실행됩니다.
- **주민등록번호 미전송**: 입력하신 주민등록번호는 절대 서버로 전송되지 않습니다. PDF 생성 후 로컬 저장만 가능합니다.
- **임시 저장**: 입력한 데이터(주민번호 제외)는 브라우저 localStorage에만 저장되며, 서버에 동기화되지 않습니다.

## 스택

- **Frontend**: React 19 + TypeScript + Vite
- **폼**: react-hook-form + zod
- **PDF**: @react-pdf/renderer (한글 폰트 임베딩)
- **도장**: Canvas 2D → PNG → PDF 삽입
- **테스트**: vitest
- **배포**: Cloudflare Pages (master push 자동 배포) — leecoachmom.com

## 참고 자료

- [상증세법 시행령 제62조](https://law.go.kr/) - 유기정기금 할인평가 근거
- [참고 구현](https://portfolio.ezinit.com/giftofcash) - 우동호 유기정기금 계약서 생성기
