# 유기정기금 증여계약서·평가명세서 PDF 생성 서비스

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

## 배포

### 서버 1회 준비 (수동 작업)

#### 1. Oracle Cloud Always Free 인스턴스 생성
- **인스턴스**: VM.Standard.E2.1.Micro (x86, 1GB RAM)
  - **이유**: Ampere A1(ARM, 24GB)은 현재 용량 부족으로 생성 불가. 정적 서빙만 하므로 저사양 x86으로 충분(nginx 상주 10~20MB).
- **이미지**: Ubuntu 22.04 LTS (또는 최신)
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

#### 4. nginx 설정 배포
로컬 머신에서 다음 명령으로 설정을 서버에 복사합니다:
```bash
scp deploy/nginx.conf ubuntu@<HOST>:/tmp/
ssh ubuntu@<HOST> 'sudo mv /tmp/nginx.conf /etc/nginx/sites-available/gift-annuity'
ssh ubuntu@<HOST> 'sudo ln -sf /etc/nginx/sites-available/gift-annuity /etc/nginx/sites-enabled/'
ssh ubuntu@<HOST> 'sudo rm -f /etc/nginx/sites-enabled/default'
ssh ubuntu@<HOST> 'sudo systemctl restart nginx'
```

#### 5. 도메인 설정
- 도메인 A 레코드를 인스턴스의 공개 IP로 가리킵니다.
- `deploy/nginx.conf`의 `server_name _;`을 실제 도메인으로 변경합니다.

#### 6. HTTPS 설정 (Let's Encrypt)
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
- **배포**: nginx + Let's Encrypt (Oracle Cloud Always Free)

## 참고 자료

- [상증세법 시행령 제62조](https://law.go.kr/) - 유기정기금 할인평가 근거
- [참고 구현](https://portfolio.ezinit.com/giftofcash) - 우동호 유기정기금 계약서 생성기
