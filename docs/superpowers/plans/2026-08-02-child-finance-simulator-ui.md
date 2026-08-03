# Child Finance Simulator UI Implementation Plan

**Goal:** 완성된 증여자산 계산 도메인 위에 입력·비교 결과 UI와 계약서 도구 간 안전한 양방향 승계를 추가한다.

**Architecture:** `/simulator`는 lazy 로드되는 독립 단일 페이지이며, 폼 상태를 `SimulateInput`으로 변환해 검증 후 `useMemo`에서 즉시 계산한다. 도구 간 값은 개인정보를 제외한 허용 필드만 별도 `sessionStorage` 키에 일회성으로 저장한다.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, 기존 CSS 토큰

---

### Task 1: 일회성 핸드오프 저장소

**Files:**
- Create: `src/storage/simHandoff.test.ts`
- Create: `src/storage/simHandoff.ts`

1. 양방향 저장·일회성 로드·깨진 JSON·개인정보 키 부재 테스트를 작성한다.
2. 해당 테스트가 모듈 부재로 실패하는지 실행한다.
3. 두 고정 키와 허용 타입만 사용하는 최소 구현을 추가한다.
4. 해당 테스트를 다시 실행한다.

### Task 2: 시뮬레이터 페이지

**Files:**
- Create: `src/ui/simulator/Simulator.test.tsx`
- Create: `src/ui/simulator/Simulator.tsx`
- Modify: `src/ui/App.css`

1. 기본 입력, 결과 미표시, 핸드오프 복원 렌더 스모크를 작성한다.
2. 페이지 부재로 실패하는지 실행한다.
3. 두 증여 방식 입력, 백분율 변환·검증·즉시 계산, 증여 단계와 동등한 상품 카드, 경고·가정·면책·역방향 CTA를 구현한다.
4. 모바일 우선 CSS와 640px 상품 카드 가로 전환을 추가하고 테스트를 실행한다.

### Task 3: 기존 도구와 페이지 연결

**Files:**
- Modify: `src/ui/Step3Result.test.tsx`
- Modify: `src/ui/steps/Step3Result.tsx`
- Modify: `src/ui/App.test.tsx`
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/resolvePage.tsx`
- Modify: `functions/routeMeta.test.js`
- Modify: `functions/routeMeta.js`
- Modify: `public/sitemap.xml`

1. Step3 CTA 승계와 App 핸드오프 우선 복원 테스트를 먼저 추가하고 실패를 확인한다.
2. 허용된 계약 조건만 저장해 이동하고, App 초기값에서 draft 위에 핸드오프 terms를 병합한다.
3. lazy 라우트, 정확히 일치하는 메타, 사이트맵 URL을 추가한다.
4. 관련 테스트를 실행한다.

### Task 4: 전체 검증

1. `npx tsc -b`를 실행해 타입 오류가 없는지 확인한다.
2. `npm test`를 실행해 전체 회귀 테스트가 통과하는지 확인한다.
3. diff에서 `src/domain/*` 미수정, 금지 콘텐츠 부재, 개인정보 미승계를 확인한다.
