import { useEffect, useMemo, useRef, useState } from 'react';
import { ADULT_AGE, DISCLAIMER, INDEX_REFERENCE_RETURNS, TAX_LAW_AS_OF } from '../../config';
import {
  simulate,
  validateSimulateInput,
  type ProductResult,
  type ProductType,
  type SimulateInput,
  type SimulateResult,
} from '../../domain/simulate';
import { maxAnnuityMonthlyWithinLimit } from '../../domain/limitPlanner';
import { solveTargetAmount, type SolveTargetResult } from '../../domain/solveTarget';
import { loadToSimulator, saveToContract } from '../../storage/simHandoff';
import { ARTICLES } from '../guide/articles';
import { formatKoreanDate, koreanAmount, presetEndDate } from '../format';
import { SiteHeader } from '../SiteHeader';
import { usePageMeta } from '../usePageMeta';
import { SiteFooter } from '../SiteFooter';

const META = {
  title: '자녀 증여자산 시뮬레이터 — 세후 얼마가 남을까 | 이코치맘',
  description: '증여한 돈이 아이가 자랄 때까지 얼마가 되고 세금이 얼마나 붙는지, 조건을 넣어 직접 계산해 보세요. 상품 유형별 세후 금액을 나란히 비교합니다.',
  path: '/simulator',
};

const productTypes: ProductType[] = ['domesticEquityEtf', 'domesticForeignEtf', 'overseasEtf'];
/**
 * 세 항목 모두 ETF다. 'ETF'를 떼면 첫 항목이 개별 종목 투자로 읽히므로 어디서든 전체 이름을 쓴다.
 * 표 열 머리글은 .info-table의 white-space:normal로 줄바꿈되어 너비가 넘치지 않는다.
 */
const productNames: Record<ProductType, string> = {
  domesticEquityEtf: '국내 주식형 ETF',
  domesticForeignEtf: '국내 상장 해외 ETF',
  overseasEtf: '해외 상장 ETF',
};
// 상품명만으로는 무엇을 사는 건지 와닿지 않아 결과 카드에서 한 줄로 풀어 설명한다.
const productDescs: Record<ProductType, string> = {
  domesticEquityEtf: '코스피 등 국내 지수를 따르는 ETF',
  domesticForeignEtf: '한국 거래소에서 사는 해외 지수 ETF',
  overseasEtf: '미국 등 현지 거래소에서 직접 사는 ETF',
};
const detailRows: [string, keyof ProductResult][] = [
  ['성장 후 평가액', 'finalValue'],
  ['매매차익', 'capitalGain'],
  ['분배금 세금(배당소득세)', 'distributionTax'],
  ['매도 세금', 'saleTax'],
  ['세후 금액', 'afterTax'],
];

/**
 * 계산 다음 행동으로 이어지는 무료 가이드 2편 고정 (2단계 기획 §4 C2 — 사용자 결정).
 * 유료 매뉴얼 홍보는 도구 페이지에 두지 않는다.
 */
const RELATED_GUIDE_PATHS = ['/guide/annuity-gift-report', '/guide/minor-stock-account'];
// 계산 다음 행동이 신고이므로 신고 가이드가 먼저 — ARTICLES 순서가 아니라 이 배열 순서를 따른다.
const relatedGuides = RELATED_GUIDE_PATHS
  .map((path) => ARTICLES.find((article) => article.path === path))
  .filter((article) => article !== undefined);

const won = (value: number) => `₩${Math.round(value).toLocaleString('ko-KR')}`;
/**
 * 기존 증여가 공제 한도를 넘으면 법정 계산이 과세가액 합산(§47②)·기납부세액공제 구조로
 * 가는데 신고 여부·납부세액을 몰라 세액을 정확히 낼 수 없다. 금액 대신 안내로 대체한다.
 */
const giftTaxDisplay = (result: Pick<SimulateResult, 'giftTax' | 'deduction'>) =>
  result.deduction.priorExceedsLimit ? '세무사 확인 필요' : won(result.giftTax.payable);
/** 비율(0.082) → 화면·입력용 퍼센트 문자열. 그냥 ×100 하면 8.200000000000001이 노출된다. */
const ratePercent = (rate: number) => String(Math.round(rate * 1000) / 10);
const percent = (value: string) => value.trim() === '' ? Number.NaN : Number(value) / 100;
const number = (value: string) => value.trim() === '' ? Number.NaN : Number(value);
const pad = (value: number) => String(value).padStart(2, '0');
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** 'YYYY-MM-DD' → 'YYYY년 M월'. 값이 없거나 형식이 아니면 빈 문자열. */
const yearMonthLabel = (dateStr: string): string => {
  const [year, month] = dateStr.split('-').map(Number);
  return Number.isFinite(year) && Number.isFinite(month) ? `${year}년 ${month}월` : '';
};

/**
 * 수익률 기본값은 0(수익 없음)이 아니라 급등 제외 참고값으로 시작한다 — 사용자가
 * 아무 조건도 만지지 않아도 현실적인 결과를 먼저 보게 하려는 결정(2026-08-03).
 * 코스피·S&P 500 칩의 isSelected 비교(값 일치)와 자연히 맞물려 두 칩이 선택 상태로 보인다.
 */
const referenceRateFor = (name: string): string => {
  const index = INDEX_REFERENCE_RETURNS.find((entry) => entry.name === name);
  return index ? ratePercent(index.excluding.rate) : '0';
};
const DEFAULT_DOMESTIC_GROWTH_RATE = referenceRateFor('코스피');
const DEFAULT_OVERSEAS_GROWTH_RATE = referenceRateFor('S&P 500');

function nextMonthFirst(): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  return localDate(date);
}

function birthDateFromAge(age: string): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - number(age));
  return Number.isFinite(number(age)) ? localDate(date) : '';
}

function ageFromBirthDate(birthDate: string): string {
  if (!birthDate) return '5';
  const today = new Date();
  const [year, month, day] = birthDate.split('-').map(Number);
  const birthdayPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);
  return String(today.getFullYear() - year - (birthdayPassed ? 0 : 1));
}

function yearsBetween(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '10';
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return String(Math.max(0, Math.round((end.getTime() - start.getTime() + 86_400_000) / 31_557_600_000)));
}

interface FormState {
  calculationMode: 'amount' | 'target';
  giftMethod: 'annuity' | 'lumpSum';
  targetAmount: number;
  monthlyAmount: number;
  giftYears: string;
  startDate: string;
  paymentDay: number;
  lumpSumAmount: number;
  giftDate: string;
  childAge: string;
  priorGifts: number;
  domesticGrowthRate: string;
  overseasGrowthRate: string;
  distributionRate: string;
  withdrawalAge: string;
}

/**
 * 화면 용어로 된 입력 검증. 도메인 메시지는 '자녀 생년월일', '증여 종료일'처럼
 * 이 화면에 존재하지 않는 필드를 가리켜서, 사용자가 무엇을 고쳐야 할지 알 수 없다.
 * 도메인 검증은 계산 직전의 안전망으로 남기고, 사용자에게는 이 메시지를 보여준다.
 */
function validateForm(form: FormState): string[] {
  const errors: string[] = [];
  const blank = (value: string) => value.trim() === '';

  if (blank(form.childAge) || number(form.childAge) < 0) errors.push('아이 나이를 입력해 주세요.');
  if (blank(form.domesticGrowthRate)) errors.push('국내 수익률을 입력해 주세요. 0을 넣으면 수익이 없는 경우로 계산해요.');
  if (blank(form.overseasGrowthRate)) errors.push('해외 수익률을 입력해 주세요. 0을 넣으면 수익이 없는 경우로 계산해요.');
  if (blank(form.distributionRate)) errors.push('연 분배율을 입력해 주세요. 모르면 0을 넣으세요.');

  if (form.calculationMode === 'target') {
    if (form.targetAmount <= 0) errors.push('목표 금액을 입력해 주세요.');
  }

  if (form.giftMethod === 'annuity') {
    if (blank(form.giftYears) || number(form.giftYears) < 1) errors.push('증여 기간을 1년 이상 입력해 주세요.');
    if (form.calculationMode === 'amount' && form.monthlyAmount <= 0) errors.push('매월 증여액을 입력해 주세요.');
  } else if (form.calculationMode === 'amount' && form.lumpSumAmount <= 0) {
    errors.push('증여 금액을 입력해 주세요.');
  }

  return errors;
}

function AmountInput({ id, label, value, onChange, help }: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  help?: string;
}) {
  return (
    <div className="simulator-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value > 0 ? value.toLocaleString('ko-KR') : ''}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
          onChange(digits ? Number(digits) : 0);
        }}
      />
      {value > 0 && <p className="amount-hint">{koreanAmount(value)}</p>}
      {help && <p className="simulator-help">{help}</p>}
    </div>
  );
}

export function Simulator() {
  usePageMeta(META);
  const [handoff] = useState(() => loadToSimulator());
  // 스크롤 전에는 CTA 바를 숨긴다 — 첫 폴드에서 히어로 숫자를 바가 가리지 않도록.
  // 문턱 120px: 히어로 값 하단(~814px)이 바 상단(~722px) 위로 올라오는 스크롤량(>92px)보다 크게.
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setCtaVisible(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [referenceBasis, setReferenceBasis] = useState<'excluding' | 'recent'>('excluding');
  const defaultStartDate = handoff?.startDate ?? nextMonthFirst();
  const [form, setForm] = useState<FormState>(() => ({
    calculationMode: 'amount',
    giftMethod: 'annuity',
    targetAmount: 40_000_000,
    // 월 19만·10년 기본 조건이면 평가액 약 1,965만으로 공제 한도(미성년 2,000만) 이내 —
    // 첫인상이 빨간 '한도 초과'가 아니게 한다(사용자 결정 2026-08-03).
    monthlyAmount: handoff?.monthlyAmount ?? 190_000,
    giftYears: handoff ? yearsBetween(handoff.startDate, handoff.endDate) : '10',
    startDate: defaultStartDate,
    paymentDay: handoff?.paymentDay ?? 1,
    lumpSumAmount: 24_000_000,
    giftDate: defaultStartDate,
    childAge: handoff?.childBirthDate ? ageFromBirthDate(handoff.childBirthDate) : '5',
    priorGifts: 0,
    domesticGrowthRate: DEFAULT_DOMESTIC_GROWTH_RATE,
    overseasGrowthRate: DEFAULT_OVERSEAS_GROWTH_RATE,
    distributionRate: '0',
    withdrawalAge: '',
  }));
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const endDate = useMemo(
    () => presetEndDate(form.startDate, number(form.giftYears)),
    [form.startDate, form.giftYears],
  );
  const childBirthDate = useMemo(() => birthDateFromAge(form.childAge), [form.childAge]);

  /**
   * 증여가 끝나는 해부터 인출할 수 있다. 인출 나이를 19세로 고정해 두면
   * "10살 아이에게 10년 증여" 같은 평범한 조건에서도 곧바로 모순이 생기는데,
   * 그 입력은 '자세히 설정' 안에 접혀 있어 사용자가 원인을 볼 수조차 없었다.
   * 그래서 사용자가 직접 만지기 전까지는 조건에서 파생된 값을 따라가게 한다.
   */
  const minWithdrawalAge = useMemo(() => {
    if (!childBirthDate || !endDate) return 0;
    return Number(endDate.slice(0, 4)) - Number(childBirthDate.slice(0, 4));
  }, [childBirthDate, endDate]);
  const withdrawalAge = form.withdrawalAge === ''
    ? String(Math.max(ADULT_AGE, minWithdrawalAge))
    : form.withdrawalAge;
  /**
   * 조건 입력값을 문장으로 되짚어 준다 — 각 필드는 흩어져 있어 "결국 언제부터 언제까지,
   * 몇 살에 인출하는 계산인지"를 한눈에 확인할 곳이 없었다. 날짜·나이 중 하나라도
   * 무효(NaN 등)면 잘못된 문장을 보여주는 대신 렌더하지 않는다.
   */
  const derivedNote = (() => {
    const withdrawalAgeNumber = number(withdrawalAge);
    if (!Number.isFinite(withdrawalAgeNumber)) return null;
    if (form.giftMethod === 'annuity') {
      const startLabel = yearMonthLabel(form.startDate);
      if (!startLabel || !Number.isFinite(minWithdrawalAge) || minWithdrawalAge <= 0) return null;
      return `${startLabel}부터 만 ${minWithdrawalAge}세까지 매월 증여하고, 만 ${withdrawalAgeNumber}세에 인출한다고 가정해요.`;
    }
    const giftDateLabel = yearMonthLabel(form.giftDate);
    if (!giftDateLabel) return null;
    return `${giftDateLabel}에 한 번에 증여하고, 만 ${withdrawalAgeNumber}세에 인출한다고 가정해요.`;
  })();
  const input = useMemo<SimulateInput>(() => ({
    giftMethod: form.giftMethod,
    monthlyAmount: form.monthlyAmount,
    startDate: form.startDate,
    endDate,
    paymentDay: form.paymentDay,
    lumpSumAmount: form.lumpSumAmount,
    giftDate: form.giftDate,
    childBirthDate,
    priorGifts: form.priorGifts,
    domesticGrowthRate: percent(form.domesticGrowthRate),
    overseasGrowthRate: percent(form.overseasGrowthRate),
    distributionRate: percent(form.distributionRate),
    withdrawalAge: number(withdrawalAge),
  }), [childBirthDate, endDate, form, withdrawalAge]);
  const calculation = useMemo(() => {
    // 화면 용어 검증이 우선이고, 도메인 검증은 UI가 놓친 경우만 드러내는 안전망이다.
    // 둘을 합치면 같은 문제를 두 번, 그것도 화면에 없는 필드 이름으로 말하게 된다.
    const formErrors = validateForm(form);
    const errors = formErrors.length > 0 ? formErrors : validateSimulateInput(input);
    if (errors.length > 0) return { errors, result: null, targetResults: null };
    if (form.calculationMode === 'amount') {
      return { errors, result: simulate(input), targetResults: null };
    }
    const targetResults = Object.fromEntries(productTypes.map((type) => [
      type,
      solveTargetAmount(input, type, form.targetAmount),
    ])) as Record<ProductType, SolveTargetResult>;
    return { errors, result: null, targetResults };
  }, [form, input]);

  // 입력이 잠시 비는 동안 결과가 통째로 사라지면 레이아웃이 크게 튄다.
  // 마지막 유효 결과를 흐리게 유지하고, 에러 카드만 위에 얹는다.
  const lastValidCalculation = useRef<typeof calculation | null>(null);
  if (calculation.errors.length === 0) lastValidCalculation.current = calculation;
  const display = calculation.errors.length === 0 ? calculation : lastValidCalculation.current;
  const stale = calculation.errors.length > 0 && display !== null;

  const makeContract = () => {
    const monthlyAmount = form.calculationMode === 'target'
      ? calculation.targetResults?.domesticEquityEtf.requiredAmount
      : form.monthlyAmount;
    if (monthlyAmount === null || monthlyAmount === undefined) return;
    saveToContract({
      monthlyAmount,
      startDate: form.startDate,
      endDate,
      paymentDay: form.paymentDay,
    });
    window.location.href = '/';
  };

  // 수익률 0이면 세금이 생기지 않아 세 상품이 같아진다. 고장으로 오해하지 않게 안내한다.
  const allAfterTaxEqual = display?.result
    ? new Set(productTypes.map((type) => display.result!.byProduct[type].afterTax)).size === 1
    : false;
  const allRequiredEqual = display?.targetResults
    ? new Set(productTypes.map((type) => display.targetResults![type].requiredAmount)).size === 1
    : false;
  const hasResults = display?.result != null || display?.targetResults != null;
  const financialIncomeWarning = display?.result?.financialIncomeWarning
    || Object.values(display?.targetResults ?? {}).some((result) =>
      result.simulated?.financialIncomeWarning);
  const priorExceedsLimit = display?.result?.deduction.priorExceedsLimit
    || Object.values(display?.targetResults ?? {}).some((result) =>
      result.simulated?.deduction.priorExceedsLimit);
  const staleClass = stale ? ' simulator-stale' : '';
  const bothGrowthRatesZero = percent(form.domesticGrowthRate) === 0
    && percent(form.overseasGrowthRate) === 0;
  /**
   * 히어로 금액은 상품 우열을 드러내지 않도록 특정 상품명을 쓰지 않는다.
   * 화면에 표시되는 문자열(반올림 후)이 같으면 단일 금액, 다르면 범위로 보여준다 —
   * 원시 float로 비교하면 반올림 후 같은 문자열인데 범위로 나오는 모순이 생긴다.
   */
  const heroAfterTax = display?.result
    ? (() => {
      const rounded = productTypes.map((type) => Math.round(display.result!.byProduct[type].afterTax));
      const formatted = rounded.map((value) => won(value));
      if (new Set(formatted).size === 1) return formatted[0];
      return `${won(Math.min(...rounded))} ~ ${won(Math.max(...rounded))}`;
    })()
    : null;
  const showContractCta = hasResults && form.giftMethod === 'annuity' && !stale;
  // "세금 없이 월 얼마까지?"에 대한 답 — 상품·수익률과 무관한 세법 산술이라 권유가 아니다.
  const availableLimit = display?.result?.deduction.available ?? null;
  const maxMonthly = useMemo(() => {
    if (form.giftMethod !== 'annuity' || availableLimit === null || !form.startDate || !endDate) return null;
    return maxAnnuityMonthlyWithinLimit(
      { startDate: form.startDate, endDate, paymentDay: form.paymentDay },
      availableLimit,
    );
  }, [availableLimit, endDate, form.giftMethod, form.paymentDay, form.startDate]);
  const applyReferenceRate = (scope: 'domestic' | 'overseas', rate: number) => {
    update(scope === 'domestic' ? 'domesticGrowthRate' : 'overseasGrowthRate', ratePercent(rate));
  };

  return (
    <main className={`container simulator${showContractCta ? ' simulator--has-cta' : ''}`}>
      <SiteHeader />
      {handoff && <div className="restored-notice" role="status"><p>계약서에서 입력한 조건을 불러왔어요.</p></div>}
      <h1>자녀 증여자산 시뮬레이터</h1>
      <p className="trust-note">조건을 넣으면 증여세와 상품 유형별 세후 금액을 바로 계산해요.</p>

      <section className="card simulator-form" aria-labelledby="simulator-basic-title">
        <fieldset className="simulator-mode">
          <legend>계산 모드</legend>
          <label><input type="radio" name="sim-calculation-mode" checked={form.calculationMode === 'amount'} onChange={() => update('calculationMode', 'amount')} /><span>얼마가 될까?</span></label>
          <label><input type="radio" name="sim-calculation-mode" checked={form.calculationMode === 'target'} onChange={() => update('calculationMode', 'target')} /><span>얼마씩 줘야 할까?</span></label>
        </fieldset>
        <h2 id="simulator-basic-title">기본 조건</h2>
        <div className="simulator-basic-grid">
          <div className="simulator-field">
            <label htmlFor="sim-child-age">아이 나이</label>
            <input id="sim-child-age" type="number" inputMode="numeric" min="0" step="1" value={form.childAge} onChange={(event) => update('childAge', event.target.value)} />
            {/* 미성년 판정이 만 나이 기준이라 세는 나이로 넣으면 계산이 1살 어긋난다. */}
            <p className="simulator-help">만 나이로 입력해 주세요.</p>
          </div>
          <div className="simulator-field">
            <label htmlFor="sim-gift-years">증여 기간</label>
            <div className="simulator-unit-input"><input id="sim-gift-years" type="number" inputMode="numeric" min="0" step="1" value={form.giftYears} onChange={(event) => update('giftYears', event.target.value)} /><span>년</span></div>
          </div>
          {/* 가장 중요한 입력이라 풀폭으로 키운다. */}
          <div className="simulator-field-full">
            {form.calculationMode === 'target' ? (
              <AmountInput id="sim-target-amount" label="목표 금액" value={form.targetAmount} onChange={(value) => update('targetAmount', value)} />
            ) : (
              <AmountInput id="sim-monthly-amount" label="매월 증여액" value={form.monthlyAmount} onChange={(value) => update('monthlyAmount', value)} />
            )}
          </div>
          {/* 수익률도 다른 조건과 같은 숫자 입력으로 둔다. 슬라이더는 ±20% 범위에서 1스텝이
              3.9px라 원하는 값을 집을 수 없었다. 기본값은 급등 제외 참고값(코스피·S&P 500)이다.
              기본값이 채워진 입력창이 계산된 값처럼 보이고 칩이 라디오처럼 읽혀 직접 입력
              가능하다는 게 드러나지 않는다는 리뷰가 있어, 질문형 그룹 라벨을 앞에 둔다. */}
          <p className="simulator-group-label simulator-field-full">연 수익률을 얼마로 가정할까요?</p>
          <div className="simulator-field">
            <label htmlFor="sim-domestic-growth">국내 수익률</label>
            <div className="simulator-unit-input"><input id="sim-domestic-growth" type="number" inputMode="decimal" min="-30" max="30" step="any" value={form.domesticGrowthRate} onChange={(event) => update('domesticGrowthRate', event.target.value)} /><span>%</span></div>
          </div>
          <div className="simulator-field">
            <label htmlFor="sim-overseas-growth">해외 수익률</label>
            <div className="simulator-unit-input"><input id="sim-overseas-growth" type="number" inputMode="decimal" min="-30" max="30" step="any" value={form.overseasGrowthRate} onChange={(event) => update('overseasGrowthRate', event.target.value)} /><span>%</span></div>
          </div>
          {/* 국내·해외 칩을 한 줄로 모아 세로로 쌓이며 낭비되던 높이를 없앤다.
              첫 자식 "참고값" 라벨은 칩이 라디오 선택지가 아니라 눌러서 값을 채우는
              참고 버튼임을 알려준다. */}
          <div className="preset-row simulator-reference-presets simulator-field-full">
            <span>참고값</span>
            {INDEX_REFERENCE_RETURNS.map((index) => {
              const value = ratePercent(index[referenceBasis].rate);
              const currentRate = index.scope === 'domestic' ? form.domesticGrowthRate : form.overseasGrowthRate;
              const isSelected = currentRate.trim() !== '' && Number(currentRate) === Number(value);
              return <button key={index.name} type="button" aria-pressed={isSelected} onClick={() => applyReferenceRate(index.scope, index[referenceBasis].rate)}>{index.name} {value}%</button>;
            })}
          </div>
          {/* 환율 안내가 상세 내역에만 있으면 입력 시점에 못 본다. 참고 지수도 달러 기준이다.
              직접 입력 가능성을 먼저 말해 칩이 유일한 입력 경로처럼 보이지 않게 한다. */}
          <p className="simulator-help simulator-field-full">직접 입력해도 되고, 참고값을 눌러 채워도 돼요. 원화 기준이에요(참고값엔 환율 변동 미포함).</p>
        </div>
        <details className="simulator-reference-details">
          <summary>참고 수익률 기준 바꾸기 · 출처 보기</summary>
          <div className="simulator-reference-content">
            <fieldset className="simulator-mode simulator-reference-mode">
              <legend>참고 수익률 기준</legend>
              <label><input type="radio" name="sim-reference-basis" checked={referenceBasis === 'excluding'} onChange={() => setReferenceBasis('excluding')} /><span>급등 제외</span></label>
              <label><input type="radio" name="sim-reference-basis" checked={referenceBasis === 'recent'} onChange={() => setReferenceBasis('recent')} /><span>최근까지</span></label>
            </fieldset>
            <ul className="simulator-reference-list">
              {INDEX_REFERENCE_RETURNS.map((index) => {
                const reference = index[referenceBasis];
                const basisLabel = referenceBasis === 'excluding' ? '급등 제외' : '최근까지';
                return <li key={index.name}>{index.name} · {basisLabel} {ratePercent(reference.rate)}% — {reference.period}, {reference.basis}, {reference.source}</li>;
              })}
            </ul>
            <div className="simulator-reference-warning">
              <p><strong>⚠️ 이 수치를 그대로 믿지 마세요.</strong></p>
              <p>코스피는 2025년 +75%, 2026년 들어 두 달 만에 +40% 오르며 사상 첫 6,000선을 돌파했어요. 나스닥도 최근 10년이 기술주 상승장으로 부풀려져 있어요. 두 지수 모두 최근 급등을 포함한 수치와 제외한 수치를 나란히 실은 이유예요.</p>
              <p>지수마다 측정 기간과 출처가 다르므로 행끼리 직접 비교할 수 없어요. 과거 수익률은 미래를 보장하지 않고, 어느 기간을 기준으로 삼느냐에 따라 결론이 뒤집혀요.</p>
            </div>
          </div>
        </details>
      </section>

      {calculation.errors.length > 0 && (
        <section className="card simulator-errors" role="alert" aria-labelledby="simulator-errors-title">
          <h2 id="simulator-errors-title">입력값을 확인해 주세요</h2>
          <ul>{calculation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
          {stale && <p className="simulator-stale-note">아래 결과는 마지막으로 계산된 조건 기준이에요.</p>}
        </section>
      )}
      {display?.result ? (
        <section className={`card simulator-summary${staleClass}`} data-testid="simulator-result-summary" aria-labelledby="simulator-summary-title" aria-live="polite">
          <p className="simulator-hero-label">인출 시점 세후 금액</p>
          <p className="simulator-hero-value">{heroAfterTax}</p>
          <p className="simulator-hero-sub">{display.result.deduction.priorExceedsLimit
            ? '증여세는 세무사 확인이 필요해요'
            : <>예상 증여세 {won(display.result.giftTax.payable)} 별도</>}</p>
          {derivedNote && <p className="simulator-derived-note">{derivedNote}</p>}
          <h2 id="simulator-summary-title">상품 유형별 비교</h2>
          <dl>
            {productTypes.map((type) => (
              <div key={type}><dt><span className="simulator-product-name">{productNames[type]}</span><span className="simulator-product-desc">{productDescs[type]}</span></dt><dd>{won(display.result!.byProduct[type].afterTax)}</dd></div>
            ))}
          </dl>
          {allAfterTaxEqual && bothGrowthRatesZero && <p className="simulator-equal-hint">수익률을 올려보면 상품별 세금 차이가 나타나요.</p>}
        </section>
      ) : display?.targetResults && (
        <section className={`card simulator-summary simulator-target-summary${staleClass}`} data-testid="simulator-result-summary" aria-labelledby="simulator-summary-title" aria-live="polite">
          <h2 id="simulator-summary-title">상품별 필요 금액</h2>
          <p className="simulator-target-heading">세후 {won(form.targetAmount)}을 만들려면</p>
          {derivedNote && <p className="simulator-derived-note">{derivedNote}</p>}
          <dl>
            {productTypes.map((type) => {
              const requiredAmount = display.targetResults![type].requiredAmount;
              return (
                <div key={type}>
                  <dt><span className="simulator-product-name">{productNames[type]}</span><span className="simulator-product-desc">{productDescs[type]}</span></dt>
                  <dd>{requiredAmount === null
                    ? '이 수익률로는 목표에 도달할 수 없어요'
                    : `${won(requiredAmount)}${form.giftMethod === 'annuity' ? '/월' : ''}`}</dd>
                </div>
              );
            })}
          </dl>
          {allRequiredEqual && bothGrowthRatesZero && <p className="simulator-equal-hint">수익률을 올려보면 상품별 세금 차이가 나타나요.</p>}
        </section>
      )}

      {/* 오류를 일으킨 입력이 대부분 이 안에 있다. 접혀 있으면 무엇을 고쳐야 할지 알 수 없다. */}
      <details className="card simulator-details" open={calculation.errors.length > 0}>
        <summary>자세히 설정</summary>
        <div className="simulator-details-body">
          <fieldset className="simulator-method">
            <legend>증여 방식</legend>
            <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'annuity'} onChange={() => update('giftMethod', 'annuity')} /> 매달 나눠 증여 (유기정기금)</label>
            <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'lumpSum'} onChange={() => update('giftMethod', 'lumpSum')} /> 한 번에 증여 (일시금)</label>
          </fieldset>
          {form.giftMethod === 'annuity' ? (
            <div className="simulator-advanced-grid">
              <div className="simulator-field">
                <label htmlFor="sim-payment-day">매월 지급일</label>
                <select id="sim-payment-day" value={form.paymentDay} onChange={(event) => update('paymentDay', Number(event.target.value))}>
                  {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}일</option>)}
                </select>
              </div>
              <div className="simulator-field">
                <label htmlFor="sim-start-date">증여 시작일</label>
                <input id="sim-start-date" type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} />
              </div>
            </div>
          ) : (
            <div className="simulator-advanced-grid">
              {form.calculationMode === 'amount' && <AmountInput id="sim-lump-sum" label="증여 금액" value={form.lumpSumAmount} onChange={(value) => update('lumpSumAmount', value)} />}
              <div className="simulator-field">
                <label htmlFor="sim-gift-date">증여일</label>
                <input id="sim-gift-date" type="date" value={form.giftDate} onChange={(event) => update('giftDate', event.target.value)} />
              </div>
            </div>
          )}
          <div className="simulator-advanced-grid">
            <AmountInput
              id="sim-prior-gifts"
              label="10년 내 기존 증여"
              value={form.priorGifts}
              onChange={(value) => update('priorGifts', value)}
              help="최근 10년 안에 부모 두 분이 합쳐서 이 아이에게 준 금액을 넣어 주세요. 아버지·어머니 증여는 하나로 봅니다."
            />
            {/* 단위는 기본 조건과 같이 입력창 안에 둔다 — 라벨에 괄호로 넣으면 표기가 섞인다. */}
            <div className="simulator-field">
              <label htmlFor="sim-distribution">연 분배율</label>
              <div className="simulator-unit-input"><input id="sim-distribution" type="number" inputMode="decimal" min="0" max="100" step="any" value={form.distributionRate} onChange={(event) => update('distributionRate', event.target.value)} /><span>%</span></div>
              <p className="simulator-help">ETF가 수익을 매년 나눠 주는 비율이에요. 모르면 0을 두세요.</p>
            </div>
            <div className="simulator-field">
              <label htmlFor="sim-withdrawal-age">인출 시점</label>
              <div className="simulator-unit-input"><input id="sim-withdrawal-age" type="number" inputMode="numeric" min="0" step="1" value={withdrawalAge} onChange={(event) => update('withdrawalAge', event.target.value)} /><span>세</span></div>
              <p className="simulator-help">아이가 이 나이가 될 때 전액 인출한다고 봐요.</p>
            </div>
          </div>
        </div>
      </details>

      {hasResults && (
        <>
          {display?.result && <section className={`simulator-gift-line${staleClass}`} aria-label="증여 단계">
            <h2>증여 단계</h2>
            {/* 예상 증여세는 이 화면에서 가장 궁금해할 숫자라 홀로 강조한다. */}
            <p>증여 원금 {won(display.result.giftPrincipal)} <span>·</span> 평가액 {won(display.result.giftValuation)} <span>·</span> 예상 증여세 <b>{giftTaxDisplay(display.result)}</b></p>
            {/* 일시금은 원금=평가액이라 굳이 부연하지 않는다. 유기정기금만 할인 계산이 끼어든다. */}
            {form.giftMethod === 'annuity' && <p className="simulator-help">평가액은 앞으로 줄 돈을 세법대로 할인해 계산한 증여세 기준 금액이에요.</p>}
          </section>}

          {/* 세후 금액이 왜 갈리는지가 여기 있으므로 접지 않고 펼쳐 둔다. */}
          <section className={`card simulator-breakdown${staleClass}`} aria-labelledby="simulator-breakdown-title">
            <h2 id="simulator-breakdown-title">상세 내역</h2>
            <div className="simulator-breakdown-body">
              {display?.result && <div className="simulator-deduction">
                <dl>
                  <div><dt>공제 한도 판정</dt><dd className={display.result.deduction.within ? undefined : 'simulator-deduction-excess'}>{display.result.deduction.within ? `한도 이내 (${won(display.result.deduction.available)})` : `한도 초과 ${won(display.result.deduction.excess)}`}</dd></div>
                </dl>
                {!stale && form.priorGifts > 0 && (
                  <p className="simulator-help">공제 한도 {won(display.result.deduction.limit)}에서 기존 증여를 차감해 남은 한도 {won(display.result.deduction.available)} 기준이에요.</p>
                )}
                {!display.result.deduction.within && (
                  <p className="simulator-help">증여재산 평가액이 남은 공제 한도 {won(display.result.deduction.available)}을 넘어, 넘는 금액에 증여세가 계산돼요.</p>
                )}
                {!stale && form.giftMethod === 'annuity' && maxMonthly !== null && (maxMonthly > 0 ? (
                  <p className="simulator-limit-hint">
                    이 조건에서는 월 {won(maxMonthly)}까지 한도 이내예요.
                    {form.monthlyAmount !== maxMonthly && <button type="button" onClick={() => update('monthlyAmount', maxMonthly)}>이 금액 적용</button>}
                  </p>
                ) : (
                  <p className="simulator-limit-hint">남은 공제 한도가 부족해 한도 이내 월 지급액이 없어요.</p>
                ))}
                {!stale && form.giftMethod === 'lumpSum' && (display.result.deduction.available > 0 ? (
                  <p className="simulator-limit-hint">
                    이번에 {won(display.result.deduction.available)}까지 한도 이내예요.
                    {form.lumpSumAmount !== display.result.deduction.available && <button type="button" onClick={() => update('lumpSumAmount', display.result!.deduction.available)}>이 금액 적용</button>}
                  </p>
                ) : (
                  <p className="simulator-limit-hint">기존 증여로 남은 공제 한도가 없어요.</p>
                ))}
              </div>}
              <div className="table-scroll">
                <table className="info-table simulator-detail-table">
                  <thead><tr><th scope="col">항목</th>{productTypes.map((type) => <th scope="col" key={type}>{productNames[type]}</th>)}</tr></thead>
                  <tbody>{display?.result
                    ? detailRows.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{productTypes.map((type) => {
                      const isForeignEtfSaleTaxCap = key === 'saleTax' && type === 'domesticForeignEtf';
                      return <td key={type}>{won(display.result!.byProduct[type][key])}{isForeignEtfSaleTaxCap && <span className="simulator-detail-note"> 최대</span>}</td>;
                    })}</tr>)
                    : [
                      ['필요 금액', (type: ProductType) => display?.targetResults?.[type].requiredAmount],
                      ['증여 원금 합계', (type: ProductType) => display?.targetResults?.[type].simulated?.giftPrincipal],
                      ['증여재산 평가액', (type: ProductType) => display?.targetResults?.[type].simulated?.giftValuation],
                      ['예상 증여세', (type: ProductType) => {
                        const simulated = display?.targetResults?.[type].simulated;
                        return simulated ? giftTaxDisplay(simulated) : undefined;
                      }],
                      ['세후 금액', (type: ProductType) => display?.targetResults?.[type].simulated?.byProduct[type].afterTax],
                    ].map(([label, getValue]) => <tr key={label as string}><th scope="row">{label as string}</th>{productTypes.map((type) => {
                      const value = (getValue as (type: ProductType) => number | string | null | undefined)(type);
                      return <td key={type}>{value === null || value === undefined ? '—' : (typeof value === 'string' ? value : won(value))}</td>;
                    })}</tr>)}</tbody>
                </table>
              </div>
              {/* 설명은 table-scroll 밖에 둔다 — 안에 넣으면 표 너비를 따라가 가로로 잘린다.
                  분배금·환율 설명은 표의 '분배금 세금' 행을 이해시키는 곁가지라 접어 화면 밀도를 낮춘다. */}
              <details className="simulator-caption-details">
                <summary>용어와 환율 안내</summary>
                <p className="simulator-detail-caption">
                  세 항목 모두 ETF이며 개별 종목 투자가 아니에요. 분배금은 ETF가 보유 자산에서 나온
                  수익을 지급하는 것으로, 개별 주식의 배당금과 구분해 불러요. 세법상으로는 둘 다
                  배당소득으로 과세돼요.
                </p>
                <p className="simulator-detail-caption">
                  해외 상장 ETF의 양도차익은 취득·양도 시점의 환율로 각각 원화 환산해 계산해요.
                  주가가 그대로여도 환율이 오르면 양도차익이 생겨 세금이 붙어요. 이 계산기는 환율을
                  따로 다루지 않으니 가격상승률을 원화 기준으로 넣어 주세요.
                </p>
                <p className="simulator-detail-caption">
                  국내 상장 해외 ETF는 매매차익과 과세표준기준가격이 오른 만큼 중 적은 금액에 세금을
                  매겨요. 보유한 해외 주식에서 난 손익은 그대로 과세 대상에 들어가서, 과세표준기준가격이
                  시장 가격을 거의 따라가요. 그래서 매매차익만으로 계산해도 실제와 크게 다르지 않고,
                  실제 세금은 화면에 나온 금액과 같거나 조금 적어요.
                </p>
              </details>
            </div>
          </section>

          <p className="guide-note simulator-neutral-note">{form.calculationMode === 'target'
            ? '입력한 수익률 가정이 그대로 실현될 경우의 산술 결과이며, 수익을 보장하지 않아요.'
            : '조건이 바뀌면 결과도 달라져요. 이 계산은 입력한 가정에 따른 산술 결과이며 투자 권유가 아니에요.'}</p>
          {financialIncomeWarning && <p className="warn simulator-warning">국내 상장 해외 ETF는 매매차익이 배당소득으로 과세되어 금융소득에 포함돼요. 연 2,000만 원을 넘으면 종합과세 대상이 될 수 있고, 이 계산에는 반영되어 있지 않아요.</p>}
          {priorExceedsLimit && <p className="warn simulator-warning">이미 증여한 금액이 공제 한도를 넘어, 이 계산기로는 증여세를 정확히 낼 수 없어요. 법에서는 지난 증여를 합쳐 세율을 매기고 이미 낸 세금을 빼주는데, 지난 증여를 신고했는지와 그때 낸 세액에 따라 결과가 달라지거든요. 세무사와 상담해 주세요.</p>}

          <details className="card simulator-details simulator-assumptions">
            <summary>계산의 단순화 가정</summary>
            <div className="simulator-details-body"><ul>
              <li>분배금은 세후 전액 재투자한다고 가정해요.</li>
              <li>증여세는 별도 납부하는 것으로 보고 투자 원금에서 빼지 않았어요.</li>
              <li>부모가 자녀에게 증여하는 경우를 기준으로 계산해요.</li>
              <li>
                기존 증여는 '자세히 설정'에 입력한 금액만 공제 한도에서 차감해요.
                과세표준 합산과 기납부세액공제는 반영하지 않아요.
              </li>
              <li>
                <b>환율은 따로 계산하지 않아요.</b> 모든 금액이 원화 기준이므로, 해외 상장 ETF를
                볼 때는 가격상승률에 환율 변동까지 포함한 원화 기준 수치를 넣어야 해요.
              </li>
              <li>
                인출 연도에 다른 해외주식 양도소득이 없다고 보고, 해외 상장 ETF의 연 250만 원
                기본공제를 일괄 매도 1회에 전액 적용해요.
              </li>
              <li>국내 상장 해외 ETF의 매도 세금은 매매차익 기준으로 계산해요. 과세표준기준가격 기준보다 조금 많게 잡힐 수 있어요.</li>
            </ul></div>
          </details>
          <section className="related-guides">
            <h2>다음에 읽어보세요</h2>
            {relatedGuides.map((article) => (
              <a key={article.path} className="card guide-card" href={article.path}>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <span className="guide-more">읽어보기 →</span>
              </a>
            ))}
          </section>
          {form.giftMethod === 'annuity' ? showContractCta && (
            <div className={`simulator-contract-action${ctaVisible ? '' : ' simulator-contract-action--offscreen'}`}>
              {form.calculationMode === 'target' && <p>국내 주식형 ETF 기준 필요 금액을 사용해요.</p>}
              <button type="button" className="btn-primary simulator-contract-cta" onClick={makeContract}>이 조건으로 계약서 만들기</button>
            </div>
          ) : (
            // 방식을 바꾸는 순간 버튼이 말없이 사라지면 고장으로 보인다 — 이유를 남긴다.
            <p className="simulator-contract-note">계약서 만들기는 유기정기금 방식에서만 제공돼요.</p>
          )}
        </>
      )}
      <p className="disclaimer">{DISCLAIMER}</p>
      <p className="disclaimer simulator-tax-law-note">
        {formatKoreanDate(TAX_LAW_AS_OF)} 기준 세법으로 계산했어요. 이후 세법이 바뀌면 결과가 달라질 수 있어요.
      </p>
      <SiteFooter />
    </main>
  );
}
