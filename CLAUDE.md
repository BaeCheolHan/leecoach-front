# leecoach-front

유기정기금 증여계약서·평가명세서 PDF 생성기. React 19 + TS + Vite 정적 SPA, 백엔드 없음.
백엔드는 향후 별도 레포로 분리 예정.

## 배포·도메인 (중요 — 매번 재설명 불필요)

- **운영**: https://leecoachmom.com (+www, leecoach-front.pages.dev) — **Cloudflare Pages 무료 플랜**
- **배포 방법**: `master`에 push하면 끝. Cloudflare가 자동 빌드(`npm run build` → `dist`)·배포한다.
  rsync/nginx/서버 작업 불필요. 반영은 1~2분.
- **도메인**: leecoachmom.com — 가비아 구매(연 갱신 결제만 가비아), 네임서버는 Cloudflare 위임
  (`hasslo`/`ursula.ns.cloudflare.com`). DNS·존은 Cloudflare 대시보드(joker10421@gmail.com)에서 관리.
- **서브도메인**: Cloudflare DNS에 레코드 추가만 하면 됨. 백엔드 생기면 `api.leecoachmom.com` 예정.
- **OCI(Oracle Cloud)**: 프론트 배포에 사용 안 함. 테넌시(zarsealin, ap-chuncheon-1)는 **A1 한도 0**이라
  ARM 생성 불가 — PAYG 업그레이드 전까지 E2.1.Micro만 가능. CLI 인증 구성됨(`~/.oci/config`).
  `deploy/` 아래 nginx/rsync/A1 스크립트는 향후 백엔드용 보관분.

## 도메인 규칙 (변경 시 주의)

- **계산 규약은 실측 픽스처가 기준**: `src/domain/annuity.test.ts`의 숫자는 참고 구현
  (portfolio.ezinit.com/giftofcash) 실측값 — 원 단위까지 일치해야 하며 **픽스처 수정 금지**.
  역년 절단, 첫해 n=0(무할인), 연도별 표시는 반올림·합계는 비반올림 합의 최종 1회 반올림.
- **할인율 3%·상한 20배·성년 19세**는 `src/config.ts` 상수로만 참조 (하드코딩 금지).
- **미성년 판정은 만 나이**(생년월일 기준, 증여시작일 현재) — 참고 구현의 연 나이 방식과 다름(의도된 결정).
- **주민등록번호는 절대 네트워크 전송·localStorage 저장 금지** (`storage/draft.ts`가 자동 제거).
  RRN 입력 필드는 `autoComplete="off"` 유지.
- **PDF 폰트는 나눔명조 글리프 범위 내 문자만**: 원문자(①②)·위첨자(ⁿ) 등은 깨짐 — "1." "^n" 사용.
- **면책 문구(DISCLAIMER)**: 평가명세서 PDF와 웹 화면에만 표시. **증여계약서 PDF에는 넣지 않는다**
  (계약서 진정성 흠결 방지 — 사용자 결정).

## 명령

- 테스트: `npm test` (vitest, 51개 — 전부 통과 유지)
- 타입체크: `npx tsc -b` / 빌드: `npm run build`
- 개발 서버: `npm run dev` (5173)
