import { useMemo, useRef, useState } from 'react';
import { ADULT_AGE, DISCLAIMER, INDEX_REFERENCE_RETURNS } from '../../config';
import {
  simulate,
  validateSimulateInput,
  type ProductResult,
  type ProductType,
  type SimulateInput,
} from '../../domain/simulate';
import { solveTargetAmount, type SolveTargetResult } from '../../domain/solveTarget';
import { loadToSimulator, saveToContract } from '../../storage/simHandoff';
import { koreanAmount, presetEndDate } from '../format';
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
const detailRows: [string, keyof ProductResult][] = [
  ['성장 후 평가액', 'finalValue'],
  ['매매차익', 'capitalGain'],
  ['분배금 세금(배당소득세)', 'distributionTax'],
  ['매도 세금', 'saleTax'],
  ['세후 금액', 'afterTax'],
];

const won = (value: number) => `₩${Math.round(value).toLocaleString('ko-KR')}`;
/** 비율(0.082) → 화면·입력용 퍼센트 문자열. 그냥 ×100 하면 8.200000000000001이 노출된다. */
const ratePercent = (rate: number) => String(Math.round(rate * 1000) / 10);
const percent = (value: string) => value.trim() === '' ? Number.NaN : Number(value) / 100;
const number = (value: string) => value.trim() === '' ? Number.NaN : Number(value);
const pad = (value: number) => String(value).padStart(2, '0');
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

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
  if (blank(form.domesticGrowthRate)) errors.push('국내 수익률을 입력해 주세요. 0을 넣으면 수익이 없는 경우로 계산합니다.');
  if (blank(form.overseasGrowthRate)) errors.push('해외 수익률을 입력해 주세요. 0을 넣으면 수익이 없는 경우로 계산합니다.');
  if (blank(form.distributionRate)) errors.push('연 분배율을 입력해 주세요. 모르면 0을 넣으세요.');

  if (form.calculationMode === 'target') {
    if (form.targetAmount <= 0) errors.push('목표 금액을 입력해 주세요.');
  }

  if (form.giftMethod === 'annuity') {
    if (blank(form.giftYears) || number(form.giftYears) < 1) errors.push('증여 기간은 1년 이상이어야 합니다.');
    if (form.calculationMode === 'amount' && form.monthlyAmount <= 0) errors.push('매월 증여액을 입력해 주세요.');
  } else if (form.calculationMode === 'amount' && form.lumpSumAmount <= 0) {
    errors.push('증여 금액을 입력해 주세요.');
  }

  return errors;
}

function AmountInput({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
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
    </div>
  );
}

export function Simulator() {
  usePageMeta(META);
  const [handoff] = useState(() => loadToSimulator());
  const [referenceBasis, setReferenceBasis] = useState<'excluding' | 'recent'>('excluding');
  const defaultStartDate = handoff?.startDate ?? nextMonthFirst();
  const [form, setForm] = useState<FormState>(() => ({
    calculationMode: 'amount',
    giftMethod: 'annuity',
    targetAmount: 40_000_000,
    monthlyAmount: handoff?.monthlyAmount ?? 200_000,
    giftYears: handoff ? yearsBetween(handoff.startDate, handoff.endDate) : '10',
    startDate: defaultStartDate,
    paymentDay: handoff?.paymentDay ?? 1,
    lumpSumAmount: 24_000_000,
    giftDate: defaultStartDate,
    childAge: handoff?.childBirthDate ? ageFromBirthDate(handoff.childBirthDate) : '5',
    domesticGrowthRate: '0',
    overseasGrowthRate: '0',
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
  const input = useMemo<SimulateInput>(() => ({
    giftMethod: form.giftMethod,
    monthlyAmount: form.monthlyAmount,
    startDate: form.startDate,
    endDate,
    paymentDay: form.paymentDay,
    lumpSumAmount: form.lumpSumAmount,
    giftDate: form.giftDate,
    childBirthDate,
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
  const staleClass = stale ? ' simulator-stale' : '';
  const bothGrowthRatesZero = percent(form.domesticGrowthRate) === 0
    && percent(form.overseasGrowthRate) === 0;
  const applyReferenceRate = (scope: 'domestic' | 'overseas', rate: number) => {
    update(scope === 'domestic' ? 'domesticGrowthRate' : 'overseasGrowthRate', ratePercent(rate));
  };

  return (
    <main className="container simulator">
      <SiteHeader />
      {handoff && <div className="restored-notice" role="status"><p>계약서에서 입력한 조건을 불러왔어요.</p></div>}
      <h1>자녀 증여자산 시뮬레이터</h1>
      <p className="trust-note">입력한 가정으로 증여 단계와 상품 유형별 세후 금액을 계산합니다.</p>

      <section className="card simulator-form" aria-labelledby="simulator-basic-title">
        <fieldset className="simulator-mode">
          <legend>계산 모드</legend>
          <label><input type="radio" name="sim-calculation-mode" checked={form.calculationMode === 'amount'} onChange={() => update('calculationMode', 'amount')} /><span>금액으로 계산</span></label>
          <label><input type="radio" name="sim-calculation-mode" checked={form.calculationMode === 'target'} onChange={() => update('calculationMode', 'target')} /><span>목표로 역산</span></label>
        </fieldset>
        <h2 id="simulator-basic-title">기본 조건</h2>
        <div className="simulator-basic-grid">
          <div className="simulator-field">
            <label htmlFor="sim-child-age">아이 나이</label>
            <input id="sim-child-age" type="number" inputMode="numeric" min="0" step="1" value={form.childAge} onChange={(event) => update('childAge', event.target.value)} />
            {/* 미성년 판정이 만 나이 기준이라 세는 나이로 넣으면 계산이 1살 어긋난다. */}
            <p className="simulator-help">만 나이로 입력해 주세요.</p>
          </div>
          {form.calculationMode === 'target' ? (
            <AmountInput id="sim-target-amount" label="목표 금액" value={form.targetAmount} onChange={(value) => update('targetAmount', value)} />
          ) : (
            <AmountInput id="sim-monthly-amount" label="매월 증여액" value={form.monthlyAmount} onChange={(value) => update('monthlyAmount', value)} />
          )}
          <div className="simulator-field">
            <label htmlFor="sim-gift-years">증여 기간</label>
            <div className="simulator-unit-input"><input id="sim-gift-years" type="number" inputMode="numeric" min="0" step="1" value={form.giftYears} onChange={(event) => update('giftYears', event.target.value)} /><span>년</span></div>
          </div>
          <fieldset className="simulator-mode simulator-reference-mode">
            <legend>참고 수익률 기준</legend>
            <label><input type="radio" name="sim-reference-basis" checked={referenceBasis === 'excluding'} onChange={() => setReferenceBasis('excluding')} /><span>급등 제외</span></label>
            <label><input type="radio" name="sim-reference-basis" checked={referenceBasis === 'recent'} onChange={() => setReferenceBasis('recent')} /><span>최근까지</span></label>
          </fieldset>
          {/* 수익률도 다른 조건과 같은 숫자 입력으로 둔다. 슬라이더는 ±20% 범위에서 1스텝이
              3.9px라 원하는 값을 집을 수 없었다. 기본값 0은 수익을 제시하지 않기 위함이다. */}
          <div className="simulator-field">
            <label htmlFor="sim-domestic-growth">국내 수익률</label>
            <div className="simulator-unit-input"><input id="sim-domestic-growth" type="number" inputMode="decimal" min="-30" max="30" step="any" value={form.domesticGrowthRate} onChange={(event) => update('domesticGrowthRate', event.target.value)} /><span>%</span></div>
            <div className="preset-row simulator-reference-presets">
              {INDEX_REFERENCE_RETURNS.filter((index) => index.scope === 'domestic').map((index) => {
                const value = ratePercent(index[referenceBasis].rate);
                const isSelected = form.domesticGrowthRate.trim() !== '' && Number(form.domesticGrowthRate) === Number(value);
                return <button key={index.name} type="button" aria-pressed={isSelected} onClick={() => applyReferenceRate(index.scope, index[referenceBasis].rate)}>{index.name} {value}%</button>;
              })}
            </div>
          </div>
          <div className="simulator-field">
            <label htmlFor="sim-overseas-growth">해외 수익률</label>
            <div className="simulator-unit-input"><input id="sim-overseas-growth" type="number" inputMode="decimal" min="-30" max="30" step="any" value={form.overseasGrowthRate} onChange={(event) => update('overseasGrowthRate', event.target.value)} /><span>%</span></div>
            <div className="preset-row simulator-reference-presets">
              {INDEX_REFERENCE_RETURNS.filter((index) => index.scope === 'overseas').map((index) => {
                const value = ratePercent(index[referenceBasis].rate);
                const isSelected = form.overseasGrowthRate.trim() !== '' && Number(form.overseasGrowthRate) === Number(value);
                return <button key={index.name} type="button" aria-pressed={isSelected} onClick={() => applyReferenceRate(index.scope, index[referenceBasis].rate)}>{index.name} {value}%</button>;
              })}
            </div>
            {/* 환율 안내가 상세 내역에만 있으면 입력 시점에 못 본다. 참고 지수도 달러 기준이다. */}
            <p className="simulator-help">원화 기준으로 입력해 주세요. 참고 수익률에는 환율 변동이 빠져 있습니다.</p>
          </div>
        </div>
        <details className="simulator-reference-details">
          <summary>⚠️ 참고 수익률의 출처와 주의사항</summary>
          <div className="simulator-reference-content">
            <ul className="simulator-reference-list">
              {INDEX_REFERENCE_RETURNS.map((index) => {
                const reference = index[referenceBasis];
                const basisLabel = referenceBasis === 'excluding' ? '급등 제외' : '최근까지';
                return <li key={index.name}>{index.name} · {basisLabel} {ratePercent(reference.rate)}% — {reference.period}, {reference.basis}, {reference.source}</li>;
              })}
            </ul>
            <div className="simulator-reference-warning">
              <p><strong>⚠️ 이 수치를 그대로 믿지 마세요.</strong></p>
              <p>코스피는 2025년 +75%, 2026년 들어 두 달 만에 +40% 오르며 사상 첫 6,000선을 돌파했습니다. 나스닥도 최근 10년이 기술주 상승장으로 부풀려져 있습니다. 두 지수 모두 최근 급등을 포함한 수치와 제외한 수치를 나란히 실은 이유입니다.</p>
              <p>지수마다 측정 기간과 출처가 다르므로 행끼리 직접 비교할 수 없습니다. 과거 수익률은 미래를 보장하지 않으며, 어느 기간을 기준으로 삼느냐에 따라 결론이 뒤집힙니다.</p>
            </div>
          </div>
        </details>
      </section>

      {calculation.errors.length > 0 && (
        <section className="card simulator-errors" role="alert" aria-labelledby="simulator-errors-title">
          <h2 id="simulator-errors-title">입력값을 확인해 주세요</h2>
          <ul>{calculation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
          {stale && <p className="simulator-stale-note">아래 결과는 마지막으로 계산된 조건 기준입니다.</p>}
        </section>
      )}
      {display?.result ? (
        <section className={`card simulator-summary${staleClass}`} data-testid="simulator-result-summary" aria-labelledby="simulator-summary-title" aria-live="polite">
          <h2 id="simulator-summary-title">상품별 세후 금액</h2>
          <dl>
            {productTypes.map((type) => (
              <div key={type}><dt>{productNames[type]}</dt><dd>{won(display.result!.byProduct[type].afterTax)}</dd></div>
            ))}
          </dl>
          {allAfterTaxEqual && bothGrowthRatesZero && <p className="simulator-equal-hint">수익률을 올려보면 상품별 세금 차이가 나타납니다.</p>}
        </section>
      ) : display?.targetResults && (
        <section className={`card simulator-summary simulator-target-summary${staleClass}`} data-testid="simulator-result-summary" aria-labelledby="simulator-summary-title" aria-live="polite">
          <h2 id="simulator-summary-title">상품별 필요 금액</h2>
          <p className="simulator-target-heading">세후 {won(form.targetAmount)}을 만들려면</p>
          <dl>
            {productTypes.map((type) => {
              const requiredAmount = display.targetResults![type].requiredAmount;
              return (
                <div key={type}>
                  <dt>{productNames[type]}</dt>
                  <dd>{requiredAmount === null
                    ? '이 수익률로는 목표에 도달할 수 없습니다'
                    : `${won(requiredAmount)}${form.giftMethod === 'annuity' ? '/월' : ''}`}</dd>
                </div>
              );
            })}
          </dl>
          {allRequiredEqual && bothGrowthRatesZero && <p className="simulator-equal-hint">수익률을 올려보면 상품별 세금 차이가 나타납니다.</p>}
        </section>
      )}

      {/* 오류를 일으킨 입력이 대부분 이 안에 있다. 접혀 있으면 무엇을 고쳐야 할지 알 수 없다. */}
      <details className="card simulator-details" open={calculation.errors.length > 0}>
        <summary>자세히 설정</summary>
        <div className="simulator-details-body">
          <fieldset className="simulator-method">
            <legend>증여 방식</legend>
            <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'annuity'} onChange={() => update('giftMethod', 'annuity')} /> 유기정기금</label>
            <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'lumpSum'} onChange={() => update('giftMethod', 'lumpSum')} /> 현금 일시금</label>
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
            {/* 단위는 기본 조건과 같이 입력창 안에 둔다 — 라벨에 괄호로 넣으면 표기가 섞인다. */}
            <div className="simulator-field">
              <label htmlFor="sim-distribution">연 분배율</label>
              <div className="simulator-unit-input"><input id="sim-distribution" type="number" inputMode="decimal" min="0" max="100" step="any" value={form.distributionRate} onChange={(event) => update('distributionRate', event.target.value)} /><span>%</span></div>
              <p className="simulator-help">ETF가 보유 자산의 수익을 매년 지급하는 비율입니다. 개별 주식의 배당금과 구분해 분배금이라 부릅니다.</p>
            </div>
            <div className="simulator-field">
              <label htmlFor="sim-withdrawal-age">인출 시점</label>
              <div className="simulator-unit-input"><input id="sim-withdrawal-age" type="number" inputMode="numeric" min="0" step="1" value={withdrawalAge} onChange={(event) => update('withdrawalAge', event.target.value)} /><span>세</span></div>
              <p className="simulator-help">아이가 이 나이가 될 때 전액 인출한다고 봅니다.</p>
            </div>
          </div>
        </div>
      </details>

      {hasResults && (
        <>
          {display?.result && <section className={`simulator-gift-line${staleClass}`} aria-label="증여 단계">
            <h2>증여 단계</h2>
            {/* 예상 증여세는 이 화면에서 가장 궁금해할 숫자라 홀로 강조한다. */}
            <p>증여 원금 {won(display.result.giftPrincipal)} <span>·</span> 평가액 {won(display.result.giftValuation)} <span>·</span> 예상 증여세 <b>{won(display.result.giftTax.payable)}</b></p>
          </section>}

          {/* 세후 금액이 왜 갈리는지가 여기 있으므로 접지 않고 펼쳐 둔다. */}
          <section className={`card simulator-breakdown${staleClass}`} aria-labelledby="simulator-breakdown-title">
            <h2 id="simulator-breakdown-title">상세 내역</h2>
            <div className="simulator-breakdown-body">
              {display?.result && <div className="simulator-deduction">
                <dl>
                  <div><dt>공제 한도 판정</dt><dd className={display.result.deduction.within ? undefined : 'simulator-deduction-excess'}>{display.result.deduction.within ? `한도 이내 (${won(display.result.deduction.limit)})` : `한도 초과 ${won(display.result.deduction.excess)}`}</dd></div>
                </dl>
                {!display.result.deduction.within && (
                  <p className="simulator-help">증여재산 평가액이 공제 한도 {won(display.result.deduction.limit)}을 넘어, 넘는 금액에 증여세가 계산됩니다.</p>
                )}
              </div>}
              {/* 설명은 table-scroll 밖에 둔다 — 안에 넣으면 표 너비를 따라가 가로로 잘린다. */}
              <p className="simulator-detail-caption">
                세 항목 모두 ETF이며 개별 종목 투자가 아닙니다. 분배금은 ETF가 보유 자산에서 나온
                수익을 지급하는 것으로, 개별 주식의 배당금과 구분해 부릅니다. 세법상으로는 둘 다
                배당소득으로 과세됩니다.
              </p>
              <p className="simulator-detail-caption">
                해외 상장 ETF의 양도차익은 취득·양도 시점의 환율로 각각 원화 환산해 계산합니다.
                주가가 그대로여도 환율이 오르면 양도차익이 생겨 세금이 붙습니다. 이 계산기는 환율을
                따로 다루지 않으니 가격상승률을 원화 기준으로 넣어 주세요.
              </p>
              <div className="table-scroll">
                <table className="info-table simulator-detail-table">
                  <thead><tr><th scope="col">항목</th>{productTypes.map((type) => <th scope="col" key={type}>{productNames[type]}</th>)}</tr></thead>
                  <tbody>{display?.result
                    ? detailRows.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{productTypes.map((type) => <td key={type}>{won(display.result!.byProduct[type][key])}</td>)}</tr>)
                    : [
                      ['필요 금액', (type: ProductType) => display?.targetResults?.[type].requiredAmount],
                      ['증여 원금 합계', (type: ProductType) => display?.targetResults?.[type].simulated?.giftPrincipal],
                      ['증여재산 평가액', (type: ProductType) => display?.targetResults?.[type].simulated?.giftValuation],
                      ['예상 증여세', (type: ProductType) => display?.targetResults?.[type].simulated?.giftTax.payable],
                      ['세후 금액', (type: ProductType) => display?.targetResults?.[type].simulated?.byProduct[type].afterTax],
                    ].map(([label, getValue]) => <tr key={label as string}><th scope="row">{label as string}</th>{productTypes.map((type) => {
                      const value = (getValue as (type: ProductType) => number | null | undefined)(type);
                      return <td key={type}>{value === null || value === undefined ? '—' : won(value)}</td>;
                    })}</tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>

          <p className="guide-note simulator-neutral-note">{form.calculationMode === 'target'
            ? '입력한 수익률 가정이 그대로 실현될 경우의 산술 결과이며, 수익을 보장하지 않습니다.'
            : '조건이 바뀌면 결과도 달라집니다. 이 계산은 입력한 가정에 따른 산술 결과이며 투자 권유가 아닙니다.'}</p>
          {financialIncomeWarning && <p className="warn simulator-warning">국내 상장 해외 ETF는 매매차익이 배당소득으로 과세되어 금융소득에 포함됩니다. 연 2,000만 원을 넘으면 종합과세 대상이 될 수 있으며, 이 계산에는 반영되어 있지 않습니다.</p>}

          <details className="card simulator-details simulator-assumptions">
            <summary>계산의 단순화 가정</summary>
            <div className="simulator-details-body"><ul>
              <li>분배금은 세후 전액 재투자한다고 가정합니다.</li>
              <li>증여세는 별도 납부하는 것으로 보고 투자 원금에서 빼지 않았습니다.</li>
              <li>부모가 자녀에게 증여하는 경우를 기준으로 계산합니다.</li>
              <li>
                <b>환율은 따로 계산하지 않습니다.</b> 모든 금액이 원화 기준이므로, 해외 상장 ETF를
                볼 때는 가격상승률에 환율 변동까지 포함한 원화 기준 수치를 넣어야 합니다.
              </li>
            </ul></div>
          </details>
          {form.giftMethod === 'annuity' ? !stale && (
            <div className="simulator-contract-action">
              <button type="button" className="btn-primary simulator-contract-cta" onClick={makeContract}>이 조건으로 계약서 만들기</button>
              {form.calculationMode === 'target' && <p>국내 주식형 ETF 기준 필요 금액을 사용합니다.</p>}
            </div>
          ) : (
            // 방식을 바꾸는 순간 버튼이 말없이 사라지면 고장으로 보인다 — 이유를 남긴다.
            <p className="simulator-contract-note">계약서 만들기는 유기정기금 방식에서만 제공됩니다.</p>
          )}
        </>
      )}
      <p className="disclaimer">{DISCLAIMER}</p>
      <SiteFooter />
    </main>
  );
}
