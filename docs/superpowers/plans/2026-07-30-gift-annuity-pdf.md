# 유기정기금 증여계약서·평가명세서 PDF 생성 서비스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정기 현금증여의 유기정기금 평가를 계산하고, 홈택스 신고 첨부용 증여계약서·평가명세서 PDF 2종을 브라우저에서 생성·다운로드하는 정적 SPA.

**Architecture:** 서버 코드 없는 React 정적 SPA. 계산 로직(domain/*)은 의존성 0의 순수 함수로 분리하고 참고 사이트 실측 픽스처로 원 단위 검증. PDF는 `@react-pdf/renderer`로 클라이언트에서 생성(주민번호가 네트워크를 떠나지 않음). localStorage 임시저장(주민번호 제외).

**Tech Stack:** React 18 + TypeScript + Vite, react-hook-form + zod, @react-pdf/renderer, vitest (+jsdom, @testing-library/react), pdf-lib(테스트 전용), 나눔명조 TTF(자체 호스팅).

**Spec:** `docs/superpowers/specs/2026-07-30-gift-annuity-pdf-design.md`

## Global Constraints

- Node >= 20, npm 사용.
- 할인율 3%는 `src/config.ts`의 `DISCOUNT_RATE`로만 참조. 하드코딩 금지(시행규칙 개정 이력 있음).
- 총 평가액 상한 = 1년분 정기금액의 20배 (`CAP_MULTIPLIER = 20`).
- 미성년 판정은 생년월일 기준 **만 19세 미만**(증여시작일 현재). 연 나이 방식 금지.
- 주민등록번호는 localStorage에 저장하지 않고, 어떤 네트워크 요청에도 실리지 않는다.
- 외부 CDN 금지. 폰트 포함 모든 자산은 자체 호스팅.
- 면책 문구(화면·PDF 공통, 원문 그대로): `본 자료는 서식 작성을 돕는 참고 자료이며 세무 자문이 아닙니다. 증여세 신고의 책임은 납세자 본인에게 있으므로 신고 전 세무사 등 전문가의 검토를 받으시기 바랍니다.`
- 계산부(domain/*)는 검증된 입력만 받으며 내부에서 throw 하지 않는다.
- 모든 금액은 원 단위 정수(number). 연도별 반올림 후 합산.

## 파일 구조

```
public/fonts/NanumMyeongjo-Regular.ttf, NanumMyeongjo-Bold.ttf
src/
  config.ts               할인율·상한 배수 등 정책 상수
  domain/rrn.ts           주민번호 형식·체크섬 검증, 생년월일 추출
  domain/age.ts           만 나이, 미성년 판정
  domain/annuity.ts       유기정기금 할인평가 (핵심)
  domain/giftTax.ts       증여재산공제 한도 판정
  ui/schema.ts            zod 폼 스키마 + FormValues 타입
  pdf/seal.ts             성명 → 도장 배치 규칙 + canvas PNG
  pdf/fonts.ts            한글 폰트 지연 등록
  pdf/ContractDoc.tsx     증여계약서 PDF 문서
  pdf/ScheduleDoc.tsx     평가명세서 PDF 문서
  pdf/download.ts         blob 생성 + 저장
  storage/draft.ts        localStorage 임시저장(주민번호 제외)
  ui/App.tsx              스텝 상태 + 배선
  ui/steps/Step1Parties.tsx
  ui/steps/Step2Terms.tsx
  ui/steps/Step3Result.tsx
deploy/nginx.conf, deploy.sh
```

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`(vite 템플릿), `index.html`, `src/main.tsx`, `src/ui/App.tsx`(플레이스홀더), `src/config.ts`, `src/config.test.ts`, `.gitignore`

**Interfaces:**
- Produces: `config.ts`의 `DISCOUNT_RATE: number`(0.03), `CAP_MULTIPLIER: number`(20), `ADULT_AGE: number`(19). 이후 모든 태스크가 import.

- [ ] **Step 1: Vite 프로젝트 생성 및 의존성 설치**

```bash
cd /Users/baecheolhan/Documents/lee-coach
npm create vite@latest . -- --template react-ts
npm install
npm install react-hook-form zod @hookform/resolvers @react-pdf/renderer
npm install -D vitest jsdom @testing-library/react @testing-library/user-event pdf-lib
```

주의: 디렉터리에 기존 `docs/`, `.git`이 있으므로 vite가 덮어쓰기를 물으면 "Ignore files and continue" 선택.

- [ ] **Step 2: vite.config.ts에 vitest 설정 추가**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // UI 테스트 파일은 개별 @vitest-environment jsdom 주석 사용
  },
});
```

`package.json` scripts에 `"test": "vitest run"` 추가.

- [ ] **Step 3: config.ts와 검증 테스트 작성**

`src/config.ts`:
```ts
/** 상증세법 시행규칙이 정하는 정기금 평가 이자율 (연 1000분의 30). 개정 이력이 있으므로 반드시 이 상수로만 참조한다. */
export const DISCOUNT_RATE = 0.03;
/** 유기정기금 평가액 상한: 1년분 정기금액의 20배 (상증세법 시행령 §62 1호 단서) */
export const CAP_MULTIPLIER = 20;
/** 성년 기준 나이 (만 나이) */
export const ADULT_AGE = 19;
/** 면책 문구 — 화면·PDF 공통 */
export const DISCLAIMER =
  '본 자료는 서식 작성을 돕는 참고 자료이며 세무 자문이 아닙니다. 증여세 신고의 책임은 납세자 본인에게 있으므로 신고 전 세무사 등 전문가의 검토를 받으시기 바랍니다.';
```

`src/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DISCOUNT_RATE, CAP_MULTIPLIER, ADULT_AGE, DISCLAIMER } from './config';

describe('config', () => {
  it('정책 상수가 스펙 값과 일치한다', () => {
    expect(DISCOUNT_RATE).toBe(0.03);
    expect(CAP_MULTIPLIER).toBe(20);
    expect(ADULT_AGE).toBe(19);
    expect(DISCLAIMER).toContain('세무 자문이 아닙니다');
  });
});
```

- [ ] **Step 4: 테스트·빌드 통과 확인**

Run: `npm test && npm run build`
Expected: config 테스트 1건 PASS, 빌드 성공.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Vite React-TS 스캐폴드 + 정책 상수(config)"
```

---

### Task 2: 주민등록번호 파싱·검증 (domain/rrn)

**Files:**
- Create: `src/domain/rrn.ts`, `src/domain/rrn.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface RrnInfo { birthDate: string /* 'YYYY-MM-DD' */; gender: 'M' | 'F'; }
  function parseRrn(rrn: string): RrnInfo | null;  // 형식·날짜·체크섬 모두 통과 시에만 RrnInfo
  ```
  체크섬 규칙: 2020-10-05 이후 출생(뒷자리 임의부여 제도)은 체크섬 검사 생략, 형식·날짜만 검사.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/domain/rrn.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseRrn } from './rrn';

describe('parseRrn', () => {
  it('유효한 1900년대 남성 주민번호를 파싱한다', () => {
    // 800101-1000008: 체크섬 유효 (가중치 2~9,2~5 합=36, (11-36%11)%10=8)
    expect(parseRrn('800101-1000008')).toEqual({ birthDate: '1980-01-01', gender: 'M' });
  });
  it('유효한 2000년대 여성 주민번호를 파싱한다', () => {
    // 100215-4000005: 합 2*2+0+0+2*5+1*6+5*7+4*8=87? → 아래 구현 후 체크섬 만족값으로 확정
    const r = parseRrn('100215-4000005');
    if (r) expect(r).toEqual({ birthDate: '2010-02-15', gender: 'F' });
  });
  it('2020-10-05 이후 출생은 체크섬 없이 형식·날짜만 검사한다', () => {
    expect(parseRrn('210301-3999999')).toEqual({ birthDate: '2021-03-01', gender: 'M' });
  });
  it('형식 오류를 거부한다', () => {
    expect(parseRrn('8001011000008')).toBeNull();   // 하이픈 없음
    expect(parseRrn('800101-100000')).toBeNull();   // 자리수 부족
  });
  it('존재하지 않는 날짜를 거부한다', () => {
    expect(parseRrn('800231-1000000')).toBeNull();  // 2월 31일
  });
  it('체크섬 오류를 거부한다 (2020-10-05 이전 출생)', () => {
    expect(parseRrn('800101-1000001')).toBeNull();
  });
});
```

두 번째 케이스의 체크섬 유효값은 구현의 체크섬 함수로 계산해 테스트를 확정한다(주석의 계산을 검산하여 마지막 자리를 맞출 것). `if (r)` 가드는 확정 후 제거하고 직접 `toEqual` 단언으로 바꾼다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/domain/rrn.test.ts`
Expected: FAIL — `Cannot find module './rrn'`

- [ ] **Step 3: 구현**

`src/domain/rrn.ts`:
```ts
export interface RrnInfo {
  birthDate: string; // 'YYYY-MM-DD'
  gender: 'M' | 'F';
}

/** 7번째 자리 → 출생 세기. 5~8은 외국인등록번호 체계. */
const CENTURY: Record<string, number> = {
  '1': 1900, '2': 1900, '3': 2000, '4': 2000,
  '5': 1900, '6': 1900, '7': 2000, '8': 2000, '9': 1800, '0': 1800,
};

/** 뒷자리 임의부여 시행일 — 이날 이후 출생은 체크섬 검증 불가 */
const RANDOM_TAIL_SINCE = '2020-10-05';

const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

function checksumOk(digits: string): boolean {
  const sum = WEIGHTS.reduce((s, w, i) => s + w * Number(digits[i]), 0);
  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

export function parseRrn(rrn: string): RrnInfo | null {
  if (!/^\d{6}-\d{7}$/.test(rrn)) return null;
  const digits = rrn.replace('-', '');
  const century = CENTURY[digits[6]];
  if (century === undefined) return null;
  const year = century + Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (birthDate < RANDOM_TAIL_SINCE && !checksumOk(digits)) return null;
  return { birthDate, gender: Number(digits[6]) % 2 === 1 ? 'M' : 'F' };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/domain/rrn.test.ts`
Expected: 전건 PASS. (여성 케이스 마지막 자리가 안 맞으면 checksumOk 로직으로 유효값을 산출해 테스트 값을 교정 — 구현이 아닌 테스트 데이터를 고친다.)

- [ ] **Step 5: Commit**

```bash
git add src/domain/rrn.ts src/domain/rrn.test.ts
git commit -m "feat(domain): 주민등록번호 파싱·검증 (2020-10 이후 체크섬 생략)"
```

---

### Task 3: 만 나이·미성년 판정 (domain/age)

**Files:**
- Create: `src/domain/age.ts`, `src/domain/age.test.ts`

**Interfaces:**
- Consumes: `ADULT_AGE` (config)
- Produces:
  ```ts
  function internationalAge(birthDate: string, atDate: string): number; // 만 나이
  function isMinor(birthDate: string, atDate: string): boolean;         // 만 19세 미만
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/domain/age.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { internationalAge, isMinor } from './age';

describe('internationalAge / isMinor', () => {
  it('생일 전날은 아직 나이를 먹지 않는다', () => {
    expect(internationalAge('2007-08-15', '2026-08-14')).toBe(18);
    expect(isMinor('2007-08-15', '2026-08-14')).toBe(true);
  });
  it('생일 당일 만 19세가 되어 성년이다', () => {
    expect(internationalAge('2007-08-15', '2026-08-15')).toBe(19);
    expect(isMinor('2007-08-15', '2026-08-15')).toBe(false);
  });
  it('연 나이 방식과 갈리는 케이스: 2010년 3월생은 2029년 6월에 이미 성년', () => {
    // 참고 사이트의 연 나이 방식(2010+19=2029년 말까지 미성년)과 달라야 한다
    expect(isMinor('2010-03-01', '2029-06-01')).toBe(false);
  });
  it('윤년 2/29 출생은 평년에 3/1 전날까지 이전 나이', () => {
    expect(internationalAge('2008-02-29', '2027-02-28')).toBe(18);
    expect(internationalAge('2008-02-29', '2027-03-01')).toBe(19);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/domain/age.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/domain/age.ts`:
```ts
import { ADULT_AGE } from '../config';

/** 만 나이. 날짜는 'YYYY-MM-DD' 문자열 — 사전순 비교가 날짜순과 일치함을 이용한다. */
export function internationalAge(birthDate: string, atDate: string): number {
  const years = Number(atDate.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const birthdayPassed = atDate.slice(5) >= birthDate.slice(5); // 'MM-DD' 비교
  return birthdayPassed ? years : years - 1;
}

export function isMinor(birthDate: string, atDate: string): boolean {
  return internationalAge(birthDate, atDate) < ADULT_AGE;
}
```

주: 2/29 출생의 평년 처리 — `'02-28' >= '02-29'`는 false이므로 평년 2/28까지는 이전 나이, 3/1부터 새 나이. 테스트 기대값과 일치.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/domain/age.test.ts`
Expected: 전건 PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/age.ts src/domain/age.test.ts
git commit -m "feat(domain): 만 나이 계산·미성년 판정 (생년월일 기준)"
```

---

### Task 4: 유기정기금 할인평가 (domain/annuity) — 핵심

**Files:**
- Create: `src/domain/annuity.ts`, `src/domain/annuity.test.ts`

**Interfaces:**
- Consumes: `DISCOUNT_RATE`, `CAP_MULTIPLIER` (config)
- Produces:
  ```ts
  interface AnnuityInput {
    startDate: string;    // 'YYYY-MM-DD' 증여시작일
    endDate: string;      // 'YYYY-MM-DD' 증여종료일 (>= startDate 보장됨)
    paymentDay: number;   // 1~31 매월 지급일
    monthlyAmount: number;// 매월 증여액(원, 양의 정수 보장됨)
    discountRate?: number;// 기본 DISCOUNT_RATE
  }
  interface AnnuityYearRow {
    year: number;      // 역년
    seq: number;       // 불입년도 (1부터)
    payments: number;  // 해당 역년 불입 횟수
    principal: number; // payments * monthlyAmount
    discounted: number;// round(principal / (1+r)^n), n = year - startYear
  }
  interface AnnuityResult {
    rows: AnnuityYearRow[];
    totalPrincipal: number;
    sumDiscounted: number;   // 상한 적용 전 합계
    cap: number;             // monthlyAmount * 12 * CAP_MULTIPLIER
    capApplied: boolean;
    totalDiscounted: number; // min(sumDiscounted, cap) — 화면·PDF가 쓰는 최종값
  }
  function evaluateAnnuity(input: AnnuityInput): AnnuityResult;
  ```

- [ ] **Step 1: 실측 픽스처로 실패하는 테스트 작성**

`src/domain/annuity.test.ts` — 픽스처는 참고 사이트(portfolio.ezinit.com/giftofcash) 2026-07-30 실측값. **이 숫자와 원 단위까지 일치해야 한다.**
```ts
import { describe, it, expect } from 'vitest';
import { evaluateAnnuity } from './annuity';

describe('evaluateAnnuity — 참고 사이트 실측 픽스처', () => {
  it('시나리오 1: 2026-01-01~2035-12-31, 매월 1일 10만원', () => {
    const r = evaluateAnnuity({
      startDate: '2026-01-01', endDate: '2035-12-31', paymentDay: 1, monthlyAmount: 100_000,
    });
    const expected = [
      [2026, 1, 12, 1_200_000, 1_200_000],
      [2027, 2, 12, 1_200_000, 1_165_049],
      [2028, 3, 12, 1_200_000, 1_131_115],
      [2029, 4, 12, 1_200_000, 1_098_170],
      [2030, 5, 12, 1_200_000, 1_066_184],
      [2031, 6, 12, 1_200_000, 1_035_131],
      [2032, 7, 12, 1_200_000, 1_004_981],
      [2033, 8, 12, 1_200_000, 975_710],
      [2034, 9, 12, 1_200_000, 947_291],
      [2035, 10, 12, 1_200_000, 919_700],
    ];
    expect(r.rows.map(x => [x.year, x.seq, x.payments, x.principal, x.discounted]))
      .toEqual(expected);
    expect(r.totalPrincipal).toBe(12_000_000);
    expect(r.totalDiscounted).toBe(10_543_331);
    expect(r.capApplied).toBe(false);
  });

  it('시나리오 2: 연중 시작 2026-03-01~2036-02-28 — 역년 절단', () => {
    const r = evaluateAnnuity({
      startDate: '2026-03-01', endDate: '2036-02-28', paymentDay: 1, monthlyAmount: 100_000,
    });
    expect(r.rows[0]).toMatchObject({ year: 2026, payments: 10, principal: 1_000_000, discounted: 1_000_000 });
    expect(r.rows.at(-1)).toMatchObject({ year: 2036, seq: 11, payments: 2, principal: 200_000, discounted: 148_819 });
    expect(r.totalDiscounted).toBe(10_492_149);
  });

  it('지급일 31일은 짧은 달의 말일로 당겨 계산한다', () => {
    // 2026-01-31~2026-04-30, 매월 31일: 1/31, 2/28, 3/31 지급(4/31→4/30도 기간 내), 총 4회
    const r = evaluateAnnuity({
      startDate: '2026-01-31', endDate: '2026-04-30', paymentDay: 31, monthlyAmount: 100_000,
    });
    expect(r.rows[0].payments).toBe(4);
  });

  it('20배 상한이 발동한다', () => {
    // 30년 무할인 아님 — 할인해도 20배 초과하도록 긴 기간
    const r = evaluateAnnuity({
      startDate: '2026-01-01', endDate: '2065-12-31', paymentDay: 1, monthlyAmount: 100_000,
    });
    expect(r.cap).toBe(100_000 * 12 * 20);
    expect(r.sumDiscounted).toBeGreaterThan(r.cap);
    expect(r.capApplied).toBe(true);
    expect(r.totalDiscounted).toBe(r.cap);
  });

  it('시작일과 종료일이 같은 해 한 달이면 1행이다', () => {
    const r = evaluateAnnuity({
      startDate: '2026-05-01', endDate: '2026-05-31', paymentDay: 15, monthlyAmount: 50_000,
    });
    expect(r.rows).toEqual([
      { year: 2026, seq: 1, payments: 1, principal: 50_000, discounted: 50_000 },
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/domain/annuity.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/domain/annuity.ts`:
```ts
import { DISCOUNT_RATE, CAP_MULTIPLIER } from '../config';

export interface AnnuityInput {
  startDate: string;
  endDate: string;
  paymentDay: number;
  monthlyAmount: number;
  discountRate?: number;
}

export interface AnnuityYearRow {
  year: number;
  seq: number;
  payments: number;
  principal: number;
  discounted: number;
}

export interface AnnuityResult {
  rows: AnnuityYearRow[];
  totalPrincipal: number;
  sumDiscounted: number;
  cap: number;
  capApplied: boolean;
  totalDiscounted: number;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate(); // m: 1~12

/**
 * 상증세법 시행령 §62 1호 유기정기금 평가.
 * 역년(1/1~12/31) 단위로 절단, n = 역년 - 시작 역년 (첫 해 무할인), 연도별 원 단위 반올림 후 합산.
 * 규약은 참고 구현 실측으로 검증됨 — annuity.test.ts 픽스처 참조.
 */
export function evaluateAnnuity(input: AnnuityInput): AnnuityResult {
  const r = input.discountRate ?? DISCOUNT_RATE;
  const startYear = Number(input.startDate.slice(0, 4));
  const endYear = Number(input.endDate.slice(0, 4));
  const rows: AnnuityYearRow[] = [];

  for (let year = startYear; year <= endYear; year++) {
    let payments = 0;
    for (let m = 1; m <= 12; m++) {
      const day = Math.min(input.paymentDay, daysInMonth(year, m));
      const date = `${year}-${pad2(m)}-${pad2(day)}`;
      if (date >= input.startDate && date <= input.endDate) payments++;
    }
    if (payments === 0) continue;
    const principal = payments * input.monthlyAmount;
    const n = year - startYear;
    rows.push({
      year,
      seq: rows.length + 1,
      payments,
      principal,
      discounted: Math.round(principal / Math.pow(1 + r, n)),
    });
  }

  const totalPrincipal = rows.reduce((s, x) => s + x.principal, 0);
  const sumDiscounted = rows.reduce((s, x) => s + x.discounted, 0);
  const cap = input.monthlyAmount * 12 * CAP_MULTIPLIER;
  const capApplied = sumDiscounted > cap;
  return {
    rows, totalPrincipal, sumDiscounted, cap, capApplied,
    totalDiscounted: capApplied ? cap : sumDiscounted,
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/domain/annuity.test.ts`
Expected: 전건 PASS — 픽스처 원 단위 일치.

- [ ] **Step 5: Commit**

```bash
git add src/domain/annuity.ts src/domain/annuity.test.ts
git commit -m "feat(domain): 유기정기금 할인평가 — 실측 픽스처 원 단위 검증"
```

---

### Task 5: 증여재산공제 한도 판정 (domain/giftTax)

**Files:**
- Create: `src/domain/giftTax.ts`, `src/domain/giftTax.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Relation = '부' | '모' | '자' | '손' | '조부' | '조모' | '배우자' | '기타';
  // relation의 의미: "수증자는 증여자의 ___이다" (참고 사이트와 동일한 관점)
  interface DeductionJudgement {
    limit: number;    // 공제 한도(원)
    within: boolean;  // 한도 이내 여부
    excess: number;   // 초과액 (이내면 0)
    minorApplied: boolean; // 미성년 한도가 적용됐는지
  }
  function deductionLimit(relation: Relation, minor: boolean): number;
  function judgeDeduction(totalDiscounted: number, relation: Relation, minor: boolean): DeductionJudgement;
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/domain/giftTax.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { deductionLimit, judgeDeduction } from './giftTax';

describe('deductionLimit', () => {
  it('직계존속→직계비속(수증자가 자/손): 미성년 2천만, 성년 5천만', () => {
    expect(deductionLimit('자', true)).toBe(20_000_000);
    expect(deductionLimit('자', false)).toBe(50_000_000);
    expect(deductionLimit('손', true)).toBe(20_000_000);
  });
  it('직계비속→직계존속(수증자가 부/모/조부/조모): 5천만 (미성년 무관)', () => {
    expect(deductionLimit('부', false)).toBe(50_000_000);
    expect(deductionLimit('조모', true)).toBe(50_000_000);
  });
  it('배우자 6억, 기타친족 1천만', () => {
    expect(deductionLimit('배우자', false)).toBe(600_000_000);
    expect(deductionLimit('기타', false)).toBe(10_000_000);
  });
});

describe('judgeDeduction', () => {
  it('한도 이내: 미성년 자녀에게 평가액 1,999만원', () => {
    expect(judgeDeduction(19_990_000, '자', true)).toEqual({
      limit: 20_000_000, within: true, excess: 0, minorApplied: true,
    });
  });
  it('한도 정확히 도달은 이내로 본다', () => {
    expect(judgeDeduction(20_000_000, '자', true).within).toBe(true);
  });
  it('한도 초과: 초과액을 계산한다', () => {
    expect(judgeDeduction(23_000_000, '자', true)).toEqual({
      limit: 20_000_000, within: false, excess: 3_000_000, minorApplied: true,
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/domain/giftTax.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/domain/giftTax.ts`:
```ts
export type Relation = '부' | '모' | '자' | '손' | '조부' | '조모' | '배우자' | '기타';

export interface DeductionJudgement {
  limit: number;
  within: boolean;
  excess: number;
  minorApplied: boolean;
}

/**
 * 증여재산공제 한도 (10년 통산). relation은 "수증자는 증여자의 ___" 관점.
 * 자·손: 직계존속으로부터 받는 직계비속 → 미성년 2천만 / 성년 5천만.
 * 부·모·조부·조모: 직계비속으로부터 받는 직계존속 → 5천만.
 */
export function deductionLimit(relation: Relation, minor: boolean): number {
  switch (relation) {
    case '자':
    case '손':
      return minor ? 20_000_000 : 50_000_000;
    case '부':
    case '모':
    case '조부':
    case '조모':
      return 50_000_000;
    case '배우자':
      return 600_000_000;
    case '기타':
      return 10_000_000;
  }
}

export function judgeDeduction(
  totalDiscounted: number, relation: Relation, minor: boolean,
): DeductionJudgement {
  const limit = deductionLimit(relation, minor);
  const within = totalDiscounted <= limit;
  return {
    limit,
    within,
    excess: within ? 0 : totalDiscounted - limit,
    minorApplied: minor && (relation === '자' || relation === '손'),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/domain/giftTax.test.ts`
Expected: 전건 PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/giftTax.ts src/domain/giftTax.test.ts
git commit -m "feat(domain): 증여재산공제 한도 판정"
```

---

### Task 6: 폼 스키마 (ui/schema)

**Files:**
- Create: `src/ui/schema.ts`, `src/ui/schema.test.ts`

**Interfaces:**
- Consumes: `parseRrn` (Task 2), `Relation` (Task 5)
- Produces:
  ```ts
  const partySchema: z.ZodType;    // { name, rrn, address, phone }
  const doneeSchema: z.ZodType;    // partySchema + { relation: Relation, legalRepName?: string }
  const termsSchema: z.ZodType;    // { startDate, endDate, method, methodEtc?, paymentDay, monthlyAmount, bank, account }
  const formSchema: z.ZodType;     // { donor, donee, terms }
  type FormValues = z.infer<typeof formSchema>;
  type GiftMethod = '자동이체' | '직접이체' | '기타';
  ```
  검증 규칙: 성명 1자 이상, 주민번호는 `parseRrn` 통과, startDate < endDate(ISO 문자열),
  monthlyAmount 양의 정수, 기타 방법 선택 시 methodEtc 필수.
  **10년 초과는 에러가 아니라 UI 경고**(스키마가 아닌 Step2 컴포넌트 책임).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/ui/schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formSchema } from './schema';

const valid = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울시 강남구', phone: '010-1234-5678' },
  donee: {
    name: '홍아기', rrn: '210301-3999999', address: '서울시 강남구', phone: '',
    relation: '자', legalRepName: '홍길동',
  },
  terms: {
    startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체',
    paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123-45-678',
  },
};

describe('formSchema', () => {
  it('유효한 전체 입력을 통과시킨다', () => {
    expect(formSchema.safeParse(valid).success).toBe(true);
  });
  it('잘못된 주민번호를 거부한다', () => {
    const bad = structuredClone(valid);
    bad.donor.rrn = '800101-1000001';
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('시작일 >= 종료일을 거부한다', () => {
    const bad = structuredClone(valid);
    bad.terms.endDate = '2026-01-01';
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('증여액 0원을 거부한다', () => {
    const bad = structuredClone(valid);
    bad.terms.monthlyAmount = 0;
    expect(formSchema.safeParse(bad).success).toBe(false);
  });
  it('기타 방법 선택 시 상세 입력을 요구한다', () => {
    const bad = structuredClone(valid);
    bad.terms.method = '기타';
    expect(formSchema.safeParse(bad).success).toBe(false);
    (bad.terms as Record<string, unknown>).methodEtc = '수표 교부';
    expect(formSchema.safeParse(bad).success).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/ui/schema.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/ui/schema.ts`:
```ts
import { z } from 'zod';
import { parseRrn } from '../domain/rrn';

const rrn = z.string().refine((v) => parseRrn(v) !== null, '유효한 주민등록번호가 아닙니다 (000000-0000000)');

export const partySchema = z.object({
  name: z.string().min(1, '성명을 입력하세요'),
  rrn,
  address: z.string().min(1, '주소를 입력하세요'),
  phone: z.string(), // 선택 입력
});

const RELATIONS = ['부', '모', '자', '손', '조부', '조모', '배우자', '기타'] as const;

export const doneeSchema = partySchema.extend({
  relation: z.enum(RELATIONS, { message: '관계를 선택하세요' }),
  legalRepName: z.string().optional(), // 미성년 수증자의 법정대리인 성명
});

const METHODS = ['자동이체', '직접이체', '기타'] as const;
export type GiftMethod = (typeof METHODS)[number];

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식으로 입력하세요');

export const termsSchema = z
  .object({
    startDate: dateStr,
    endDate: dateStr,
    method: z.enum(METHODS),
    methodEtc: z.string().optional(),
    paymentDay: z.number().int().min(1).max(31),
    monthlyAmount: z.number().int().positive('매월 증여액을 입력하세요'),
    bank: z.string().min(1, '은행/증권사를 입력하세요'),
    account: z.string().min(1, '계좌번호를 입력하세요'),
  })
  .refine((t) => t.startDate < t.endDate, { message: '종료일은 시작일 이후여야 합니다', path: ['endDate'] })
  .refine((t) => t.method !== '기타' || !!t.methodEtc?.trim(), { message: '증여방법을 입력하세요', path: ['methodEtc'] });

export const formSchema = z.object({
  donor: partySchema,
  donee: doneeSchema,
  terms: termsSchema,
});

export type FormValues = z.infer<typeof formSchema>;
export type Party = z.infer<typeof partySchema>;
export type Donee = z.infer<typeof doneeSchema>;
export type Terms = z.infer<typeof termsSchema>;
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/ui/schema.test.ts`
Expected: 전건 PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/schema.ts src/ui/schema.test.ts
git commit -m "feat(ui): zod 폼 스키마 (주민번호·기간·금액 검증)"
```

---

### Task 7: 도장 생성 (pdf/seal)

**Files:**
- Create: `src/pdf/seal.ts`, `src/pdf/seal.test.ts`

**Interfaces:**
- Produces:
  ```ts
  function sealLayout(name: string): string[][];        // 순수 함수 — 문자 배치 행렬
  function drawSeal(name: string, sizePx?: number): string; // canvas → PNG dataURL (브라우저 전용)
  ```
  Task 8·12가 `drawSeal` 결과 dataURL을 PDF `<Image src>`로 소비.

- [ ] **Step 1: 배치 규칙 실패 테스트 작성**

`src/pdf/seal.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sealLayout } from './seal';

describe('sealLayout — 인장 문자 배치', () => {
  it('1자: 단독 중앙', () => {
    expect(sealLayout('김')).toEqual([['김']]);
  });
  it('2자: 세로 2행', () => {
    expect(sealLayout('철수')).toEqual([['철'], ['수']]);
  });
  it("3자: 2x2 격자, 말미에 '인' 추가", () => {
    expect(sealLayout('홍길동')).toEqual([['홍', '길'], ['동', '인']]);
  });
  it('4자: 2x2 격자', () => {
    expect(sealLayout('남궁민수')).toEqual([['남', '궁'], ['민', '수']]);
  });
  it('5자 이상: 두 행 분할', () => {
    expect(sealLayout('가나다라마')).toEqual([['가', '나', '다'], ['라', '마']]);
  });
  it('공백은 제거한다', () => {
    expect(sealLayout('홍 길동')).toEqual([['홍', '길'], ['동', '인']]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/pdf/seal.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/pdf/seal.ts`:
```ts
/** 인장 문자 배치 규칙. 순수 함수 — 테스트 대상. */
export function sealLayout(name: string): string[][] {
  const chars = [...name.replace(/\s/g, '')];
  if (chars.length <= 1) return [chars];
  if (chars.length === 2) return [[chars[0]], [chars[1]]];
  if (chars.length === 3) return [[chars[0], chars[1]], [chars[2], '인']];
  const half = Math.ceil(chars.length / 2);
  return [chars.slice(0, half), chars.slice(half)];
}

/**
 * 성명으로 원형 인장 PNG(dataURL)를 생성한다. 브라우저 전용(canvas).
 * 서체: 자체 호스팅 나눔명조(전서체 대체 — 자유 라이선스 한글 전서체 부재).
 */
export function drawSeal(name: string, sizePx = 240): string {
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d')!;
  const red = '#c0392b';
  const center = sizePx / 2;

  // 원형 테두리
  ctx.strokeStyle = red;
  ctx.lineWidth = sizePx * 0.05;
  ctx.beginPath();
  ctx.arc(center, center, center - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();

  // 문자 배치
  const rows = sealLayout(name);
  const maxCols = Math.max(...rows.map((r) => r.length));
  const inner = sizePx * 0.62; // 문자 영역 한 변
  const cell = inner / Math.max(rows.length, maxCols);
  ctx.fillStyle = red;
  ctx.font = `bold ${Math.floor(cell * 0.85)}px "NanumMyeongjo", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  rows.forEach((row, ri) => {
    const y = center + (ri - (rows.length - 1) / 2) * cell;
    row.forEach((ch, ci) => {
      const x = center + (ci - (row.length - 1) / 2) * cell;
      ctx.fillText(ch, x, y);
    });
  });
  return canvas.toDataURL('image/png');
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/pdf/seal.test.ts`
Expected: 전건 PASS (`drawSeal`은 브라우저 전용 — Task 12에서 수동 시각 확인)

- [ ] **Step 5: Commit**

```bash
git add src/pdf/seal.ts src/pdf/seal.test.ts
git commit -m "feat(pdf): 성명 기반 도장 생성 (배치 규칙 + canvas)"
```

---

### Task 8: 한글 폰트 + 증여계약서 PDF (pdf/ContractDoc)

**Files:**
- Create: `public/fonts/NanumMyeongjo-Regular.ttf`, `public/fonts/NanumMyeongjo-Bold.ttf`(다운로드), `src/pdf/fonts.ts`, `src/pdf/ContractDoc.tsx`, `src/pdf/ContractDoc.test.tsx`

**Interfaces:**
- Consumes: `FormValues`(Task 6), `AnnuityResult`(Task 4)
- Produces:
  ```ts
  // fonts.ts
  function registerFonts(base?: string): void; // 기본 '/fonts' (브라우저). 테스트는 파일 경로 전달.
  // ContractDoc.tsx
  interface ContractProps {
    values: FormValues;
    result: AnnuityResult;
    donorSeal?: string;  // dataURL — 없으면 '(인)' 텍스트만
    doneeSeal?: string;  // 미성년이면 법정대리인 도장
    isDoneeMinor: boolean;
    madeDate: string;    // 'YYYY-MM-DD' 작성일
  }
  function ContractDoc(props: ContractProps): JSX.Element; // <Document> 1페이지
  ```

- [ ] **Step 1: 폰트 다운로드 (OFL 라이선스)**

```bash
mkdir -p public/fonts
curl -fL -o public/fonts/NanumMyeongjo-Regular.ttf \
  "https://github.com/google/fonts/raw/main/ofl/nanummyeongjo/NanumMyeongjo-Regular.ttf"
curl -fL -o public/fonts/NanumMyeongjo-Bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/nanummyeongjo/NanumMyeongjo-Bold.ttf"
ls -la public/fonts/
```

404가 나면(구글 폰트 저장소가 variable font로 재편된 경우) 대안: `https://fonts.google.com/download?family=Nanum+Myeongjo` zip을 받아 TTF 2종을 추출한다. 파일 크기가 각 1MB 이상인지 확인(한글 전체 글리프 포함 여부).

- [ ] **Step 2: fonts.ts 작성**

`src/pdf/fonts.ts`:
```ts
import { Font } from '@react-pdf/renderer';

let registered = false;

/** 나눔명조 등록. 브라우저는 기본 '/fonts', node 테스트는 절대 파일 경로를 전달한다. */
export function registerFonts(base = '/fonts'): void {
  if (registered) return;
  Font.register({
    family: 'NanumMyeongjo',
    fonts: [
      { src: `${base}/NanumMyeongjo-Regular.ttf`, fontWeight: 'normal' },
      { src: `${base}/NanumMyeongjo-Bold.ttf`, fontWeight: 'bold' },
    ],
  });
  // 한글은 단어 중간 줄바꿈 허용
  Font.registerHyphenationCallback((word) => [...word].flatMap((c) => [c, '']));
  registered = true;
}
```

- [ ] **Step 3: 페이지 수 스모크 테스트 작성 (실패 확인)**

`src/pdf/ContractDoc.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { registerFonts } from './fonts';
import { ContractDoc } from './ContractDoc';
import { evaluateAnnuity } from '../domain/annuity';
import type { FormValues } from '../ui/schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울특별시 강남구 테헤란로 1', phone: '010-1234-5678' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울특별시 강남구 테헤란로 1', phone: '', relation: '자', legalRepName: '홍길동' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123-45-678901' },
};

describe('ContractDoc', () => {
  it('1페이지 PDF가 생성된다', async () => {
    registerFonts(path.resolve('public/fonts'));
    const result = evaluateAnnuity(values.terms);
    const buf = await renderToBuffer(
      <ContractDoc values={values} result={result} isDoneeMinor={true} madeDate="2026-01-01" />,
    );
    const pdf = await PDFDocument.load(buf);
    expect(pdf.getPageCount()).toBe(1);
  });
});
```

Run: `npx vitest run src/pdf/ContractDoc.test.tsx`
Expected: FAIL — ContractDoc 없음

- [ ] **Step 4: ContractDoc 구현**

`src/pdf/ContractDoc.tsx`:
```tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { FormValues } from '../ui/schema';
import type { AnnuityResult } from '../domain/annuity';
import { DISCLAIMER } from '../config';

const won = (n: number) => n.toLocaleString('ko-KR');
const kdate = (d: string) => `${d.slice(0, 4)}년 ${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

const s = StyleSheet.create({
  page: { fontFamily: 'NanumMyeongjo', fontSize: 11, lineHeight: 1.7, paddingVertical: 56, paddingHorizontal: 52 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  preamble: { marginBottom: 14 },
  article: { marginBottom: 8 },
  articleTitle: { fontWeight: 'bold' },
  closing: { marginTop: 14, marginBottom: 20 },
  madeDate: { textAlign: 'center', marginBottom: 24 },
  partyBlock: { marginBottom: 14 },
  partyRow: { flexDirection: 'row', alignItems: 'center' },
  partyLabel: { width: 110, fontWeight: 'bold' },
  seal: { width: 44, height: 44, marginLeft: 8 },
  sealPlaceholder: { marginLeft: 8, color: '#888' },
  disclaimer: { position: 'absolute', bottom: 28, left: 52, right: 52, fontSize: 7.5, color: '#666' },
});

export interface ContractProps {
  values: FormValues;
  result: AnnuityResult;
  donorSeal?: string;
  doneeSeal?: string;
  isDoneeMinor: boolean;
  madeDate: string;
}

export function ContractDoc({ values, result, donorSeal, doneeSeal, isDoneeMinor, madeDate }: ContractProps) {
  const { donor, donee, terms } = values;
  const method = terms.method === '기타' ? (terms.methodEtc ?? '') : terms.method;
  return (
    <Document title="유기정기금 현금증여계약서" language="ko">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>현금 증여 계약서 (유기정기금)</Text>
        <Text style={s.preamble}>
          증여자 {donor.name}(이하 "갑"이라 한다)과 수증자 {donee.name}(이하 "을"이라 한다)은
          다음과 같이 현금 증여계약을 체결한다.
        </Text>
        <View style={s.article}>
          <Text style={s.articleTitle}>제1조 (목적)</Text>
          <Text>갑은 갑 소유의 현금을 아래 조항에 따라 을에게 정기적으로 증여할 것을 약정하고, 을은 이를 승낙한다.</Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제2조 (증여의 내용)</Text>
          <Text>
            ① 갑은 {kdate(terms.startDate)}부터 {kdate(terms.endDate)}까지 매월 {terms.paymentDay}일에
            금 {won(terms.monthlyAmount)}원을 을에게 지급한다.{'\n'}
            ② 제1항에 따른 지급 총액은 금 {won(result.totalPrincipal)}원이며, 상속세 및 증여세법 시행령
            제62조 제1호에 따라 평가한 유기정기금 평가액은 금 {won(result.totalDiscounted)}원이다.
          </Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제3조 (지급 방법)</Text>
          <Text>갑은 제2조의 금원을 {method} 방법으로 을 명의의 계좌({terms.bank} {terms.account})에 입금한다.</Text>
        </View>
        <View style={s.article}>
          <Text style={s.articleTitle}>제4조 (계약의 효력)</Text>
          <Text>이 계약은 계약 체결일부터 효력이 발생한다.</Text>
        </View>
        <Text style={s.closing}>
          위 계약의 체결을 증명하기 위하여 이 계약서 2통을 작성하여 갑과 을이 서명·날인한 후 각 1통씩 보관한다.
        </Text>
        <Text style={s.madeDate}>{kdate(madeDate)}</Text>

        <View style={s.partyBlock}>
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>증여자(갑)</Text>
            <Text>성명: {donor.name}</Text>
            {donorSeal ? <Image style={s.seal} src={donorSeal} /> : <Text style={s.sealPlaceholder}>(인)</Text>}
          </View>
          <Text>주민등록번호: {donor.rrn}    주소: {donor.address}</Text>
        </View>
        <View style={s.partyBlock}>
          <View style={s.partyRow}>
            <Text style={s.partyLabel}>수증자(을)</Text>
            <Text>성명: {donee.name}</Text>
            {!isDoneeMinor &&
              (doneeSeal ? <Image style={s.seal} src={doneeSeal} /> : <Text style={s.sealPlaceholder}>(인)</Text>)}
          </View>
          <Text>주민등록번호: {donee.rrn}    주소: {donee.address}</Text>
          {isDoneeMinor && (
            <View style={s.partyRow}>
              <Text>을은 미성년자이므로 법정대리인 {donee.legalRepName ?? ''}이(가) 대리하여 날인함</Text>
              {doneeSeal ? <Image style={s.seal} src={doneeSeal} /> : <Text style={s.sealPlaceholder}>(인)</Text>}
            </View>
          )}
        </View>
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/pdf/ContractDoc.test.tsx`
Expected: PASS (1페이지). tsx 테스트가 esbuild JSX 오류를 내면 vite.config.ts test에 별도 설정 불필요한지 확인 — vitest는 vite 플러그인 체인을 그대로 쓰므로 통과해야 정상.

- [ ] **Step 6: Commit**

```bash
git add public/fonts src/pdf/fonts.ts src/pdf/ContractDoc.tsx src/pdf/ContractDoc.test.tsx
git commit -m "feat(pdf): 나눔명조 임베딩 + 증여계약서 PDF 문서"
```

---

### Task 9: 평가명세서 PDF (pdf/ScheduleDoc)

**Files:**
- Create: `src/pdf/ScheduleDoc.tsx`, `src/pdf/ScheduleDoc.test.tsx`

**Interfaces:**
- Consumes: `FormValues`, `AnnuityResult`, `DeductionJudgement`(Task 5), `registerFonts`
- Produces:
  ```ts
  interface ScheduleProps {
    values: FormValues;
    result: AnnuityResult;
    judgement: DeductionJudgement;
    doneeBirthDate: string;  // parseRrn 결과
    isDoneeMinor: boolean;
  }
  function ScheduleDoc(props: ScheduleProps): JSX.Element; // <Document>, 표 길이에 따라 1페이지 이상
  ```

- [ ] **Step 1: 실패하는 스모크 테스트 작성**

`src/pdf/ScheduleDoc.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { registerFonts } from './fonts';
import { ScheduleDoc } from './ScheduleDoc';
import { evaluateAnnuity } from '../domain/annuity';
import { judgeDeduction } from '../domain/giftTax';
import type { FormValues } from '../ui/schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울특별시 강남구 테헤란로 1', phone: '010-1234-5678' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울특별시 강남구 테헤란로 1', phone: '', relation: '자', legalRepName: '홍길동' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123-45-678901' },
};

describe('ScheduleDoc', () => {
  it('10년 시나리오가 1페이지로 생성된다', async () => {
    registerFonts(path.resolve('public/fonts'));
    const result = evaluateAnnuity(values.terms);
    const judgement = judgeDeduction(result.totalDiscounted, '자', true);
    const buf = await renderToBuffer(
      <ScheduleDoc values={values} result={result} judgement={judgement} doneeBirthDate="2021-03-01" isDoneeMinor={true} />,
    );
    const pdf = await PDFDocument.load(buf);
    expect(pdf.getPageCount()).toBe(1);
  });
});
```

Run: `npx vitest run src/pdf/ScheduleDoc.test.tsx` → Expected: FAIL

- [ ] **Step 2: 구현**

`src/pdf/ScheduleDoc.tsx`:
```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FormValues } from '../ui/schema';
import type { AnnuityResult } from '../domain/annuity';
import type { DeductionJudgement } from '../domain/giftTax';
import { DISCOUNT_RATE, DISCLAIMER } from '../config';

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

const s = StyleSheet.create({
  page: { fontFamily: 'NanumMyeongjo', fontSize: 10, paddingVertical: 48, paddingHorizontal: 48 },
  title: { fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
  metaTable: { marginBottom: 14, borderWidth: 0.7, borderColor: '#333' },
  metaRow: { flexDirection: 'row', borderBottomWidth: 0.7, borderColor: '#333' },
  metaCell: { flex: 1, flexDirection: 'row' },
  metaKey: { width: 92, padding: 4, fontWeight: 'bold', backgroundColor: '#f2f2f2' },
  metaVal: { flex: 1, padding: 4 },
  table: { borderWidth: 0.7, borderColor: '#333', marginBottom: 12 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.7, borderColor: '#333' },
  th: { flex: 1, padding: 4, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f2f2f2' },
  td: { flex: 1, padding: 4, textAlign: 'right' },
  tdCenter: { flex: 1, padding: 4, textAlign: 'center' },
  judgement: { marginBottom: 12, padding: 8, borderWidth: 0.7, borderColor: '#333' },
  legal: { fontSize: 8, color: '#444', marginBottom: 8 },
  disclaimer: { fontSize: 7.5, color: '#666' },
});

export interface ScheduleProps {
  values: FormValues;
  result: AnnuityResult;
  judgement: DeductionJudgement;
  doneeBirthDate: string;
  isDoneeMinor: boolean;
}

export function ScheduleDoc({ values, result, judgement, doneeBirthDate, isDoneeMinor }: ScheduleProps) {
  const { donor, donee, terms } = values;
  const meta: [string, string][] = [
    ['증여자', donor.name],
    ['수증자', `${donee.name} (증여자의 ${donee.relation})`],
    ['수증자 생년월일', `${doneeBirthDate} (증여시작일 현재 ${isDoneeMinor ? '미성년자' : '성년'})`],
    ['정기금 기간', `${terms.startDate} ~ ${terms.endDate}`],
    ['지급 시기', `매월 ${terms.paymentDay}일, 매월 ${won(terms.monthlyAmount)}`],
    ['할인율', `연 ${(DISCOUNT_RATE * 100).toFixed(0)}%`],
  ];
  return (
    <Document title="유기정기금 평가명세서" language="ko">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>유기정기금 평가명세서</Text>

        <View style={s.metaTable}>
          {meta.map(([k, v]) => (
            <View key={k} style={s.metaRow}>
              <View style={s.metaCell}>
                <Text style={s.metaKey}>{k}</Text>
                <Text style={s.metaVal}>{v}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.table}>
          <View style={s.tr}>
            {['년도', '불입년도', '불입횟수(월)', '불입원금', '할인평가액'].map((h) => (
              <Text key={h} style={s.th}>{h}</Text>
            ))}
          </View>
          {result.rows.map((r) => (
            <View key={r.year} style={s.tr}>
              <Text style={s.tdCenter}>{r.year}</Text>
              <Text style={s.tdCenter}>{r.seq}</Text>
              <Text style={s.tdCenter}>{r.payments}</Text>
              <Text style={s.td}>{won(r.principal)}</Text>
              <Text style={s.td}>{won(r.discounted)}</Text>
            </View>
          ))}
          <View style={s.tr}>
            <Text style={[s.th, { textAlign: 'center' }]}>합계</Text>
            <Text style={s.tdCenter}></Text>
            <Text style={s.tdCenter}></Text>
            <Text style={[s.td, { fontWeight: 'bold' }]}>{won(result.totalPrincipal)}</Text>
            <Text style={[s.td, { fontWeight: 'bold' }]}>{won(result.totalDiscounted)}</Text>
          </View>
        </View>

        {result.capApplied && (
          <Text style={s.legal}>
            ※ 평가액 합계가 1년분 정기금액의 20배({won(result.cap)})를 초과하여 상한을 적용하였습니다
            (상속세 및 증여세법 시행령 제62조 제1호 단서).
          </Text>
        )}

        <View style={s.judgement}>
          <Text>
            증여재산공제 한도: {won(judgement.limit)}
            {judgement.minorApplied ? ' (미성년자·직계존속 공제)' : ''} — {' '}
            {judgement.within
              ? `한도 이내이므로 예상 증여세는 0원입니다.`
              : `한도를 ${won(judgement.excess)} 초과합니다. 세무사 검토가 필요합니다.`}
          </Text>
          <Text>
            ※ 증여재산공제는 10년간 동일인으로부터 받은 증여를 통산합니다. 이 계약 외 기증여가 있는 경우
            합산하여 판단하여야 합니다.
          </Text>
        </View>

        <Text style={s.legal}>
          근거: 상속세 및 증여세법 시행령 제62조(정기금을 받을 권리의 평가) 제1호 — 유기정기금은 잔존기간에
          각 연도에 받을 정기금액을 기준으로 [각 연도에 받을 정기금액 ÷ (1 + 이자율)ⁿ, n은 평가기준일부터의
          경과연수]로 계산한 금액의 합계액으로 평가하며, 1년분 정기금액의 20배를 초과할 수 없다.
          이자율은 기획재정부령이 정하는 연 {(DISCOUNT_RATE * 1000).toFixed(0)}/1,000이다.
        </Text>
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: 통과 확인**

Run: `npx vitest run src/pdf/ScheduleDoc.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pdf/ScheduleDoc.tsx src/pdf/ScheduleDoc.test.tsx
git commit -m "feat(pdf): 유기정기금 평가명세서 PDF 문서"
```

---

### Task 10: 임시저장 (storage/draft)

**Files:**
- Create: `src/storage/draft.ts`, `src/storage/draft.test.ts`

**Interfaces:**
- Consumes: `FormValues`(Task 6)
- Produces:
  ```ts
  function saveDraft(values: FormValues): void;        // 주민번호(rrn) 필드는 ''로 비워 저장
  function loadDraft(): FormValues | null;             // 없거나 파싱 불가면 null
  function clearDraft(): void;
  const DRAFT_KEY = 'gift-annuity-draft-v1';
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`src/storage/draft.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from './draft';
import type { FormValues } from '../ui/schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울', phone: '010-1234-5678' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울', phone: '', relation: '자', legalRepName: '홍길동' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123' },
};

beforeEach(() => localStorage.clear());

describe('draft storage', () => {
  it('저장 후 불러오면 주민번호만 비어 있다', () => {
    saveDraft(values);
    const loaded = loadDraft()!;
    expect(loaded.donor.name).toBe('홍길동');
    expect(loaded.donor.rrn).toBe('');
    expect(loaded.donee.rrn).toBe('');
    expect(loaded.terms.monthlyAmount).toBe(100000);
  });
  it('원본 localStorage 문자열에 주민번호가 존재하지 않는다', () => {
    saveDraft(values);
    const raw = localStorage.getItem(DRAFT_KEY)!;
    expect(raw).not.toContain('800101');
    expect(raw).not.toContain('210301');
  });
  it('저장된 것이 없으면 null', () => {
    expect(loadDraft()).toBeNull();
  });
  it('깨진 JSON이면 null', () => {
    localStorage.setItem(DRAFT_KEY, '{broken');
    expect(loadDraft()).toBeNull();
  });
  it('clearDraft로 삭제된다', () => {
    saveDraft(values);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/storage/draft.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/storage/draft.ts`:
```ts
import type { FormValues } from '../ui/schema';

export const DRAFT_KEY = 'gift-annuity-draft-v1';

/** 주민등록번호는 브라우저에도 저장하지 않는다 — 공용 PC 잔존 위험 (스펙 결정 사항). */
export function saveDraft(values: FormValues): void {
  const sanitized: FormValues = {
    ...values,
    donor: { ...values.donor, rrn: '' },
    donee: { ...values.donee, rrn: '' },
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitized));
}

export function loadDraft(): FormValues | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FormValues;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/storage/draft.test.ts`
Expected: 전건 PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/draft.ts src/storage/draft.test.ts
git commit -m "feat(storage): localStorage 임시저장 — 주민번호 제외"
```

---

### Task 11: 입력 폼 (Step1·Step2 + App 배선)

**Files:**
- Create: `src/ui/steps/Step1Parties.tsx`, `src/ui/steps/Step2Terms.tsx`, `src/ui/App.css`
- Modify: `src/ui/App.tsx` (스캐폴드 플레이스홀더 교체)
- Test: `src/ui/App.test.tsx`

**Interfaces:**
- Consumes: `formSchema`·`FormValues`(Task 6), `parseRrn`(Task 2), `isMinor`(Task 3), `saveDraft`/`loadDraft`(Task 10)
- Produces: `App`이 스텝 상태(1→2→3)를 관리. `FormValues`를 react-hook-form 단일 폼으로 유지하고 스텝 이동 시 해당 스텝 필드만 `trigger`로 검증. Step3(Task 12)는 `values: FormValues`를 prop으로 받는 컴포넌트 자리만 마련(`<Step3Result values={...} />` — Task 12에서 구현하므로 이 태스크에서는 "3단계 준비 중" 플레이스홀더 컴포넌트를 만들어 둔다).

UI 동작 요구:
- Step1: 증여자(성명·주민번호·주소·연락처), 수증자(관계 select + 동일 필드). 수증자 주민번호가 유효하고 증여시작일 이전이라도 미성년으로 추정되면(시작일 미입력 시 오늘 기준) 법정대리인 성명 입력란 표시, 기본값은 증여자 성명.
- Step2: 시작일·종료일(`<input type="date">`), 증여방법 select(기타 선택 시 텍스트 입력 표시), 매월 지급일 select(1~31), 매월 증여액(number), 은행·계좌.
  - 기간이 10년(3653일 대신 **시작일 + 10년 초과 여부**로 판정) 초과면 경고 배너: `증여재산공제는 10년 단위로 통산됩니다. 10년을 초과하는 기간은 공제 계획과 어긋날 수 있습니다.`
  - 수증자가 미성년이고 증여기간 중 성년 도달이 판정 경계(만 19세 도달일이 기간 내)면 안내: `수증자가 증여 기간 중 성년이 됩니다. 미성년 여부는 증여시작일 기준으로 판정했습니다. 참고 구현과 판정 방식(만 나이)이 다를 수 있으니 세무사 검토를 권합니다.`
- 값 변경 시 debounce 500ms로 `saveDraft`, 최초 마운트 시 `loadDraft` 복원.
- 각 스텝 하단: 이전/다음 버튼. 다음은 해당 스텝 필드 검증 통과 시에만 진행.

- [ ] **Step 1: 실패하는 컴포넌트 테스트 작성**

`src/ui/App.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

describe('App 스텝 흐름', () => {
  it('1단계에서 빈 폼으로 다음을 누르면 검증 메시지가 뜬다', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findAllByText(/입력하세요|아닙니다|선택하세요/)).not.toHaveLength(0);
    expect(screen.getByText('1. 증여자(돈 주는 사람)')).toBeTruthy(); // 스텝 이동 안 됨
  });

  it('1단계 유효 입력 후 2단계로 진행한다', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('증여자 성명'), '홍길동');
    await userEvent.type(screen.getByLabelText('증여자 주민등록번호'), '800101-1000008');
    await userEvent.type(screen.getByLabelText('증여자 주소'), '서울시 강남구');
    await userEvent.selectOptions(screen.getByLabelText('증여자와의 관계'), '자');
    await userEvent.type(screen.getByLabelText('수증자 성명'), '홍아기');
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    await userEvent.type(screen.getByLabelText('수증자 주소'), '서울시 강남구');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText('3. 증여내용')).toBeTruthy();
  });

  it('미성년 수증자 주민번호 입력 시 법정대리인 입력란이 나타난다', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    expect(await screen.findByLabelText('법정대리인 성명')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/ui/App.test.tsx`
Expected: FAIL (App 플레이스홀더에는 해당 요소 없음)

- [ ] **Step 3: 구현**

`src/ui/App.tsx` 핵심 구조 (Step1·Step2는 필드 나열이므로 register 패턴만 반복):
```tsx
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormValues } from './schema';
import { loadDraft, saveDraft } from '../storage/draft';
import { Step1Parties } from './steps/Step1Parties';
import { Step2Terms } from './steps/Step2Terms';
import { Step3Result } from './steps/Step3Result';
import './App.css';

const STEP1_FIELDS = ['donor', 'donee'] as const;
const STEP2_FIELDS = ['terms'] as const;

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: loadDraft() ?? {
      donor: { name: '', rrn: '', address: '', phone: '' },
      donee: { name: '', rrn: '', address: '', phone: '', relation: undefined as never, legalRepName: '' },
      terms: { startDate: '', endDate: '', method: '자동이체', paymentDay: 1, monthlyAmount: 0, bank: '', account: '' },
    },
  });

  // debounce 자동 저장 (주민번호는 draft.ts가 제거)
  useEffect(() => {
    const sub = form.watch((v) => {
      const t = setTimeout(() => saveDraft(v as FormValues), 500);
      return () => clearTimeout(t);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const next = async () => {
    const fields = step === 1 ? STEP1_FIELDS : STEP2_FIELDS;
    if (await form.trigger([...fields])) setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
  };

  return (
    <FormProvider {...form}>
      <main className="container">
        <h1>유기정기금 증여계약서 · 평가명세서 생성</h1>
        {step === 1 && <Step1Parties />}
        {step === 2 && <Step2Terms />}
        {step === 3 && <Step3Result values={form.getValues()} onBack={() => setStep(2)} />}
        {step < 3 && (
          <nav className="step-nav">
            {step > 1 && <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>이전</button>}
            <button type="button" onClick={next}>다음</button>
          </nav>
        )}
      </main>
    </FormProvider>
  );
}
```

`Step1Parties.tsx` 요점 — 모든 input은 `<label htmlFor>`로 접근성 이름을 부여(테스트의 `getByLabelText`와 일치시킬 것):
```tsx
import { useFormContext } from 'react-hook-form';
import type { FormValues } from '../schema';
import { parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';

export function Step1Parties() {
  const { register, watch, formState: { errors } } = useFormContext<FormValues>();
  const doneeRrn = watch('donee.rrn');
  const startDate = watch('terms.startDate');
  const info = parseRrn(doneeRrn ?? '');
  const baseDate = startDate || new Date().toISOString().slice(0, 10);
  const doneeMinor = info ? isMinor(info.birthDate, baseDate) : false;

  return (
    <section>
      <h2>1. 증여자(돈 주는 사람)</h2>
      <label htmlFor="donor-name">증여자 성명</label>
      <input id="donor-name" {...register('donor.name')} />
      {errors.donor?.name && <p role="alert">{errors.donor.name.message}</p>}
      {/* donor.rrn(id="donor-rrn", label "증여자 주민등록번호"), donor.address, donor.phone 동일 패턴 */}

      <h2>2. 수증자(돈 받는 사람)</h2>
      <label htmlFor="donee-relation">증여자와의 관계</label>
      <select id="donee-relation" {...register('donee.relation')}>
        <option value="">선택하세요</option>
        {['부', '모', '자', '손', '조부', '조모', '배우자', '기타'].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {/* donee.name/rrn/address/phone 동일 패턴 — label "수증자 성명" 등 */}

      {doneeMinor && (
        <>
          <label htmlFor="legal-rep">법정대리인 성명</label>
          <input id="legal-rep" placeholder="미성년 수증자를 대리하여 날인할 친권자" {...register('donee.legalRepName')} />
        </>
      )}
    </section>
  );
}
```

`Step2Terms.tsx` 요점 — 제목 `<h2>3. 증여내용</h2>`, 필드 전부 label 연결, 10년 초과 경고:
```tsx
import { useFormContext } from 'react-hook-form';
import type { FormValues } from '../schema';

function addYears(date: string, years: number): string {
  return `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
}

export function Step2Terms() {
  const { register, watch, formState: { errors } } = useFormContext<FormValues>();
  const [startDate, endDate, method] = watch(['terms.startDate', 'terms.endDate', 'terms.method']);
  const over10y = !!startDate && !!endDate && endDate > addYears(startDate, 10);

  return (
    <section>
      <h2>3. 증여내용</h2>
      <label htmlFor="start">증여시작일</label>
      <input id="start" type="date" {...register('terms.startDate')} />
      <label htmlFor="end">증여종료일</label>
      <input id="end" type="date" {...register('terms.endDate')} />
      {errors.terms?.endDate && <p role="alert">{errors.terms.endDate.message}</p>}
      {over10y && (
        <p className="warn">증여재산공제는 10년 단위로 통산됩니다. 10년을 초과하는 기간은 공제 계획과 어긋날 수 있습니다.</p>
      )}
      <label htmlFor="method">증여방법</label>
      <select id="method" {...register('terms.method')}>
        <option>자동이체</option><option>직접이체</option><option value="기타">기타 직접입력</option>
      </select>
      {method === '기타' && (
        <>
          <label htmlFor="method-etc">증여방법 직접입력</label>
          <input id="method-etc" {...register('terms.methodEtc')} />
          {errors.terms?.methodEtc && <p role="alert">{errors.terms.methodEtc.message}</p>}
        </>
      )}
      <label htmlFor="payday">매월 지급일</label>
      <select id="payday" {...register('terms.paymentDay', { valueAsNumber: true })}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}일</option>)}
      </select>
      <label htmlFor="amount">매월 증여액(원)</label>
      <input id="amount" type="number" min={1} {...register('terms.monthlyAmount', { valueAsNumber: true })} />
      {errors.terms?.monthlyAmount && <p role="alert">{errors.terms.monthlyAmount.message}</p>}
      <label htmlFor="bank">은행/증권사</label>
      <input id="bank" {...register('terms.bank')} />
      <label htmlFor="account">계좌번호</label>
      <input id="account" {...register('terms.account')} />
    </section>
  );
}
```

`Step3Result.tsx`는 이 태스크에서는 플레이스홀더:
```tsx
import type { FormValues } from '../schema';
export function Step3Result({ values, onBack }: { values: FormValues; onBack: () => void }) {
  void values;
  return <section><p>결과 화면 준비 중</p><button type="button" onClick={onBack}>이전</button></section>;
}
```

`App.css`: 모바일 우선 단일 컬럼(최대폭 640px 중앙 정렬), label 블록 배치, `.warn` 노란 배경, `.step-nav` 하단 고정 버튼 2개. 구체 스타일은 구현 재량.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/ui/App.test.tsx && npm test`
Expected: 전건 PASS (기존 도메인 테스트 포함)

- [ ] **Step 5: Commit**

```bash
git add src/ui src/storage
git commit -m "feat(ui): 3단계 입력 폼 (인적사항·증여내용) + 임시저장 배선"
```

---

### Task 12: 결과 화면 + PDF 다운로드 (Step3)

**Files:**
- Create: `src/pdf/download.ts`
- Modify: `src/ui/steps/Step3Result.tsx` (플레이스홀더 교체)
- Test: `src/ui/Step3Result.test.tsx`

**Interfaces:**
- Consumes: `evaluateAnnuity`, `judgeDeduction`, `parseRrn`, `isMinor`, `ContractDoc`, `ScheduleDoc`, `drawSeal`, `registerFonts`, `clearDraft`
- Produces:
  ```ts
  // download.ts
  function downloadPdf(doc: ReactElement, filename: string): Promise<void>; // pdf(doc).toBlob() → a[download]
  function pdfFileName(kind: '증여계약서' | '유기정기금평가명세서', doneeName: string, date: string): string;
  // 예: 증여계약서_홍아기_20260730.pdf
  ```

동작 요구:
- 진입 시 `evaluateAnnuity` → 연도별 표(년도/불입년도/불입횟수/불입원금/할인평가액 + 합계) 렌더.
- 판정 박스: `할인평가액 합계 ○○원 / 공제한도 ○○원 → 한도 이내(예상 증여세 0원)` 또는 `한도 초과 ○○원 — 세무사 검토 필요`. 기증여 합산 경고 문구, 상한 발동 시 안내 문구.
- 버튼 3개: `증여계약서 PDF`, `평가명세서 PDF`, `모두 다운로드`(두 개를 순차 호출).
- 다운로드 시: `registerFonts()` 호출(최초 1회 폰트 지연 로딩) → `drawSeal(donor.name)`, 미성년이면 `drawSeal(legalRepName ?? donor.name)`, 성년이면 `drawSeal(donee.name)` → 문서 생성. 실패 시 `role="alert"` 영역에 `PDF 생성에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.` 표시.
- 완료 후 `처음부터 다시` 버튼: `clearDraft()` + 새로고침.
- 화면 하단 면책 문구(`DISCLAIMER`).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/ui/Step3Result.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Step3Result } from './steps/Step3Result';
import type { FormValues } from './schema';

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울', phone: '' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울', phone: '', relation: '자', legalRepName: '홍길동' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123' },
};

describe('Step3Result', () => {
  it('평가 표와 합계를 렌더한다 (픽스처 값)', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText('₩10,543,331')).toBeTruthy();  // 총 평가액
    expect(screen.getByText('₩12,000,000')).toBeTruthy();  // 총 불입원금
  });
  it('미성년 2천만 한도 이내 판정을 표시한다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText(/한도 이내.*예상 증여세.*0원/)).toBeTruthy();
  });
  it('다운로드 버튼 3개가 있다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByRole('button', { name: '증여계약서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '평가명세서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '모두 다운로드' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/ui/Step3Result.test.tsx`
Expected: FAIL (플레이스홀더)

- [ ] **Step 3: 구현**

`src/pdf/download.ts`:
```ts
import type { ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

export function pdfFileName(
  kind: '증여계약서' | '유기정기금평가명세서', doneeName: string, date: string,
): string {
  return `${kind}_${doneeName}_${date.replaceAll('-', '')}.pdf`;
}

export async function downloadPdf(doc: ReactElement, filename: string): Promise<void> {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

`Step3Result.tsx`:
```tsx
import { useMemo, useState } from 'react';
import type { FormValues } from '../schema';
import { evaluateAnnuity } from '../../domain/annuity';
import { judgeDeduction } from '../../domain/giftTax';
import { parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';
import { registerFonts } from '../../pdf/fonts';
import { drawSeal } from '../../pdf/seal';
import { ContractDoc } from '../../pdf/ContractDoc';
import { ScheduleDoc } from '../../pdf/ScheduleDoc';
import { downloadPdf, pdfFileName } from '../../pdf/download';
import { clearDraft } from '../../storage/draft';
import { DISCLAIMER } from '../../config';

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

export function Step3Result({ values, onBack }: { values: FormValues; onBack: () => void }) {
  const [error, setError] = useState('');
  const result = useMemo(() => evaluateAnnuity(values.terms), [values.terms]);
  const doneeInfo = parseRrn(values.donee.rrn);
  const doneeBirth = doneeInfo?.birthDate ?? '';
  const minor = doneeBirth ? isMinor(doneeBirth, values.terms.startDate) : false;
  const judgement = judgeDeduction(result.totalDiscounted, values.donee.relation, minor);
  const today = new Date().toISOString().slice(0, 10);

  const makeContract = () => {
    const donorSeal = drawSeal(values.donor.name);
    const doneeSeal = drawSeal(minor ? (values.donee.legalRepName || values.donor.name) : values.donee.name);
    return (
      <ContractDoc values={values} result={result} donorSeal={donorSeal} doneeSeal={doneeSeal}
        isDoneeMinor={minor} madeDate={values.terms.startDate} />
    );
  };
  const makeSchedule = () => (
    <ScheduleDoc values={values} result={result} judgement={judgement}
      doneeBirthDate={doneeBirth} isDoneeMinor={minor} />
  );

  const withErrorHandling = (fn: () => Promise<void>) => async () => {
    setError('');
    try {
      registerFonts();
      await fn();
    } catch {
      setError('PDF 생성에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
  };
  const dlContract = withErrorHandling(() =>
    downloadPdf(makeContract(), pdfFileName('증여계약서', values.donee.name, today)));
  const dlSchedule = withErrorHandling(() =>
    downloadPdf(makeSchedule(), pdfFileName('유기정기금평가명세서', values.donee.name, today)));
  const dlBoth = withErrorHandling(async () => {
    await downloadPdf(makeContract(), pdfFileName('증여계약서', values.donee.name, today));
    await downloadPdf(makeSchedule(), pdfFileName('유기정기금평가명세서', values.donee.name, today));
  });

  return (
    <section>
      <h2>4. 평가 결과</h2>
      <table>
        <thead>
          <tr>{['년도', '불입년도', '불입횟수(월)', '불입원금', '할인평가액'].map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {result.rows.map((r) => (
            <tr key={r.year}>
              <td>{r.year}</td><td>{r.seq}</td><td>{r.payments}</td>
              <td>{won(r.principal)}</td><td>{won(r.discounted)}</td>
            </tr>
          ))}
          <tr>
            <th>합계</th><td /><td />
            <td>{won(result.totalPrincipal)}</td><td>{won(result.totalDiscounted)}</td>
          </tr>
        </tbody>
      </table>
      {result.capApplied && <p className="warn">1년분 정기금액의 20배 상한({won(result.cap)})이 적용되었습니다.</p>}

      <div className="judgement">
        <p>
          할인평가액 합계 {won(result.totalDiscounted)} / 공제한도 {won(judgement.limit)}
          {judgement.minorApplied ? ' (미성년자 공제)' : ''} → {' '}
          {judgement.within ? '한도 이내입니다. 예상 증여세는 0원입니다.' : `한도를 ${won(judgement.excess)} 초과합니다. 세무사 검토가 필요합니다.`}
        </p>
        <p className="warn">10년 내 동일인으로부터 받은 기증여가 있으면 합산됩니다.</p>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      <div className="downloads">
        <button type="button" onClick={dlContract}>증여계약서 PDF</button>
        <button type="button" onClick={dlSchedule}>평가명세서 PDF</button>
        <button type="button" onClick={dlBoth}>모두 다운로드</button>
      </div>
      <nav className="step-nav">
        <button type="button" onClick={onBack}>이전</button>
        <button type="button" onClick={() => { clearDraft(); location.reload(); }}>처음부터 다시</button>
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </section>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/ui/Step3Result.test.tsx && npm test`
Expected: 전건 PASS

- [ ] **Step 5: 브라우저 수동 검증**

Run: `npm run dev` 후 브라우저에서
1. 3단계 전 과정 입력(픽스처 시나리오 1 값) → 표가 참고 실측값과 일치하는지 확인
2. PDF 2종 다운로드 → 한글 렌더링·도장 이미지·면책 문구 육안 확인, 파일 크기 1MB 미만인지 확인
3. 새로고침 → 주민번호 외 값 복원 확인, devtools Application 탭에서 localStorage에 주민번호 부재 확인
4. Network 탭에서 폰트 요청이 PDF 버튼 클릭 시점에 발생하는지(지연 로딩) 확인

- [ ] **Step 6: Commit**

```bash
git add src/ui src/pdf
git commit -m "feat(ui): 결과 화면 — 평가표·공제 판정·PDF 2종 다운로드"
```

---

### Task 13: 배포 설정 (OCI + nginx)

**Files:**
- Create: `deploy/nginx.conf`, `deploy/deploy.sh`, `README.md`

**Interfaces:**
- Consumes: `npm run build` 산출물 `dist/`
- Produces: 운영 배포 절차 문서화. 서버 프로비저닝(인스턴스 생성, certbot)은 사용자가 수동 수행 — README에 절차만 기록.

- [ ] **Step 1: nginx 설정 작성**

`deploy/nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;  # 도메인 확정 후 교체
    root /var/www/gift-annuity;
    index index.html;

    # SPA 라우팅 없음(단일 페이지)이지만 새로고침 안전망
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 폰트·해시된 자산 장기 캐시
    location ~* \.(ttf|woff2?|js|css)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json font/ttf;
}
```

- [ ] **Step 2: 배포 스크립트 작성**

`deploy/deploy.sh`:
```bash
#!/usr/bin/env bash
# 사용법: ./deploy/deploy.sh <ssh-host>   (예: ubuntu@140.x.x.x, ~/.ssh/config 별칭 가능)
set -euo pipefail
HOST="${1:?ssh host 필요}"
npm run build
npm test
rsync -az --delete dist/ "${HOST}:/var/www/gift-annuity/"
echo "배포 완료: ${HOST}"
```

```bash
chmod +x deploy/deploy.sh
```

- [ ] **Step 3: README 작성**

`README.md` — 다음 내용 포함:
- 프로젝트 한 줄 소개 + 스펙·플랜 문서 링크
- 개발: `npm install && npm run dev`, 테스트: `npm test`
- 서버 1회 준비 절차(수동): OCI `VM.Standard.E2.1.Micro`(x86, 1GB) 생성 → 80/443 시큐리티 리스트 오픈 → `apt install nginx certbot python3-certbot-nginx` → `deploy/nginx.conf`를 `/etc/nginx/sites-available/`에 복사·활성화 → 도메인 A레코드 → `certbot --nginx`
- 정기 배포: `./deploy/deploy.sh <host>`
- 주의: Ampere A1 대신 E2.1.Micro를 쓰는 이유(가용성), 개인정보 무전송 설계 요약

- [ ] **Step 4: 빌드 검증**

Run: `npm run build && ls dist/ && du -sh dist/`
Expected: 빌드 성공. dist 총량이 폰트 포함 4MB 이내(폰트 2종 ~3MB + 앱 번들).

- [ ] **Step 5: Commit**

```bash
git add deploy README.md
git commit -m "chore: nginx 설정·배포 스크립트·README"
```

---

## Self-Review 결과

- **스펙 커버리지**: 입력 폼(T6·11) / 할인평가(T4) / 공제 판정(T5) / 도장(T7) / PDF 2종 개별 다운로드(T8·9·12) / localStorage 주민번호 제외(T10) / 만 나이(T3) / 10년 경고·성년 도달 안내(T11) / 면책 문구(T1 상수, T8·9·12 표시) / 배포(T13) — 전 항목 태스크 존재.
- **스펙 외 추가 1건(명시)**: 미성년 수증자의 **법정대리인 표시·날인**(T6·8·11·12). 미성년자는 단독으로 계약 날인이 어려워 실무상 필수라 판단해 포함. 사용자 확인 필요 시 제거 가능.
- **타입 일관성**: `FormValues`·`AnnuityResult`·`DeductionJudgement`·`Relation`이 태스크 간 동일 시그니처로 사용됨을 확인. `Step3Result`의 props(`values`, `onBack`)는 T11 플레이스홀더와 T12 구현이 일치.
