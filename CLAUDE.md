# leecoach-front

유기정기금 증여계약서·평가명세서 PDF 생성기 + 증여 가이드 콘텐츠 사이트.
React 19 + TS + Vite 정적 SPA, 백엔드 없음(향후 별도 레포 예정). 운영자 브랜드: 이코치맘.

## 사이트 구조

- **라우팅**: 라우터 라이브러리 없음. `src/ui/resolvePage.tsx`의 pathname 분기.
  페이지: `/`(계약서 도구) · `/guide`(글 목록) · `/guide/<slug>`(글 10편) · `/privacy` · 그 외 404.
- **www.leecoachmom.com은 "가이드 입구"**: Cloudflare 대시보드의 Redirect Rules 2개가
  www 루트→`/guide`, www 기타→메인 동일 경로로 301. (Pages `_redirects`는 호스트 규칙 미지원 —
  main.tsx의 JS 리다이렉트는 안전망일 뿐 실제로는 엣지 규칙이 처리)
- **경로별 SEO/og 메타는 엣지 주입**: `functions/_middleware.js`(Pages Functions + HTMLRewriter)가
  `functions/routeMeta.js` 맵으로 title/description/og/canonical을 바꿔치기. 각 페이지의
  `usePageMeta` 값과 **반드시 동일하게 유지** (routeMeta.test.js가 검증).
- **방문 분석**: Cloudflare Web Analytics 자동 활성(대시보드 → Analytics → Web analytics).
  스크립트 추가 불필요. curl은 집계 안 되고 브라우저 방문만 잡힘.

## 가이드 글 추가 절차 (6곳 체크리스트)

1. `src/ui/guide/<Component>.tsx` — 기존 글 관례: usePageMeta(title 끝 `" | 이코치맘"`),
   FAQ 배열 → 화면 렌더 + JSON-LD(FAQPage, script id 고유하게), `card tldr` 3줄 요약,
   step-list/stat-card/guide-note 재사용, 표는 `table-scroll` 래퍼 + `info-table` 클래스
   (셀은 375px 기준 짧게), 글 끝 `ToolCta`(도구 관련 글만, 최대 1개) → `ManualPromo variant="inline"` → disclaimer
2. `src/ui/resolvePage.tsx` case 추가
3. `src/ui/guide/GuideIndex.tsx` ARTICLES 배열
4. `public/sitemap.xml` URL 추가
5. `functions/routeMeta.js` 메타 추가 (+ routeMeta.test.js 픽스처·개수 갱신)
6. `src/ui/guide/guide.test.tsx` 렌더 스모크 테스트
- 검증: `npm test` + `npm run build && npx wrangler pages dev dist`로 엣지 메타 확인
- 글 삭제 시: 위 6곳 제거 + `functions/_middleware.js`에 관련 글로 301 추가 (색인 보호)

## 콘텐츠 원칙 (유료 매뉴얼 보호 — 사용자 결정)

운영자가 크티에서 유료 PDF "세무사가 검토한 우리 아이 증여 실무 매뉴얼"
(https://ctee.kr/item/store/91932)을 판매 중. **무료 가이드는 문제 인식과 공개 법령 정보까지만**,
아래 매뉴얼 핵심은 무료 글에서 해법을 공개하지 않는다 (티저 문장으로만 연결):
- 아동수당·부모급여 비과세 관리법 (PART 1-4)
- 0세부터 시작하는 증여 플랜 상세 (PART 1-2)
- 자녀 계좌 운용 방식별 안전/위험 판단 (PART 3-1), 주식 증여 타이밍·이월과세 실무 (PART 3-2·3-3)
- 늦은 신고 케이스별 수습법 — 흩어진 계좌·차명 판정·소급 신고 등 (PART 4 전체)
- 홈택스 실제 화면 따라하기 (PART 5)
과거 사례: "늦은 신고 자가진단" 글이 PART 4를 잠식해 삭제·301 처리됨(2026-08-02).
글 발행 전 세무 내용은 핵심 주장 목록으로 요약해 사용자 검수를 받는다.

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
- **할인율 3%·상한 20배·성년 19세·과세최저한 50만**은 `src/config.ts` 상수로만 참조 (하드코딩 금지).
- **미성년 판정은 만 나이**(생년월일 기준, 증여시작일 현재) — 참고 구현의 연 나이 방식과 다름(의도된 결정).
- **주민등록번호는 절대 네트워크 전송·localStorage 저장 금지** (`storage/draft.ts`가 자동 제거).
  RRN 입력 필드는 `autoComplete="off"` 유지.
- **PDF 폰트는 나눔명조 글리프 범위 내 문자만**: 원문자(①②)·위첨자(ⁿ) 등은 깨짐 — "1." "^n" 사용.
- **면책 문구(DISCLAIMER)**: 웹 화면에만 표시. **PDF(증여계약서·평가명세서)에는 넣지 않는다**
  (계약서 진정성 흠결 방지 + 평가명세서는 국세청 제출 원본 성격 — 사용자 결정, 2026-08-01).
  평가명세서 하단의 법령 "근거" 문단도 같은 이유로 제거함.

## 명령

- 테스트: `npm test` (vitest — 전부 통과 유지)
- 타입체크: `npx tsc -b` / 빌드: `npm run build`
- 개발 서버: `npm run dev` (5173)
- 엣지(Functions) 로컬 검증: `npm run build && npx wrangler pages dev dist`

## 작업 방식 (사용자 확립 사항)

- 구현·콘텐츠 작성은 Claude가 직접 수행 (codex 위임 폐지 — 2026-08-03). agy(Gemini)는 이 프로젝트에서 사용 금지.
- 커밋·push(=배포)는 사용자가 명시적으로 요청한 뒤에만. 배포 후 운영 URL curl 확인까지.
