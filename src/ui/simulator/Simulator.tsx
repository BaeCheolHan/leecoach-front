import { useMemo, useState } from 'react';
import { DISCLAIMER } from '../../config';
import {
  simulate,
  validateSimulateInput,
  type ProductResult,
  type ProductType,
  type SimulateInput,
} from '../../domain/simulate';
import { loadToSimulator, saveToContract } from '../../storage/simHandoff';
import { koreanAmount, presetEndDate } from '../format';
import { SiteHeader } from '../SiteHeader';
import { usePageMeta } from '../usePageMeta';

const META = {
  title: '자녀 증여자산 시뮬레이터 — 세후 얼마가 남을까 | 이코치맘',
  description: '증여한 돈이 아이가 자랄 때까지 얼마가 되고 세금이 얼마나 붙는지, 조건을 넣어 직접 계산해 보세요. 상품 유형별 세후 금액을 나란히 비교합니다.',
  path: '/simulator',
};

const productTypes: ProductType[] = ['domesticEquityEtf', 'domesticForeignEtf', 'overseasEtf'];
const productNames: Record<ProductType, string> = {
  domesticEquityEtf: '국내주식형 ETF',
  domesticForeignEtf: '국내상장 해외 ETF',
  overseasEtf: '해외상장 ETF',
};
/** 상세 표 열 머리글 — 세 항목이 모두 ETF이므로 공통 접미사를 빼 표 너비를 줄인다. */
const productShortNames: Record<ProductType, string> = {
  domesticEquityEtf: '국내주식형',
  domesticForeignEtf: '국내상장 해외',
  overseasEtf: '해외상장',
};
const detailRows: [string, keyof ProductResult][] = [
  ['성장 후 평가액', 'finalValue'],
  ['매매차익', 'capitalGain'],
  ['분배금 세금', 'distributionTax'],
  ['매도 세금', 'saleTax'],
  ['세후 금액', 'afterTax'],
];

const won = (value: number) => `₩${Math.round(value).toLocaleString('ko-KR')}`;
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
  giftMethod: 'annuity' | 'lumpSum';
  monthlyAmount: number;
  giftYears: string;
  startDate: string;
  paymentDay: number;
  lumpSumAmount: number;
  giftDate: string;
  childAge: string;
  priceGrowthRate: string;
  distributionRate: string;
  withdrawalAge: string;
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
  const defaultStartDate = handoff?.startDate ?? nextMonthFirst();
  const [form, setForm] = useState<FormState>(() => ({
    giftMethod: 'annuity',
    monthlyAmount: handoff?.monthlyAmount ?? 200_000,
    giftYears: handoff ? yearsBetween(handoff.startDate, handoff.endDate) : '10',
    startDate: defaultStartDate,
    paymentDay: handoff?.paymentDay ?? 1,
    lumpSumAmount: 24_000_000,
    giftDate: defaultStartDate,
    childAge: handoff?.childBirthDate ? ageFromBirthDate(handoff.childBirthDate) : '5',
    priceGrowthRate: '0',
    distributionRate: '0',
    withdrawalAge: '19',
  }));
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const endDate = useMemo(
    () => presetEndDate(form.startDate, number(form.giftYears)),
    [form.startDate, form.giftYears],
  );
  const childBirthDate = useMemo(() => birthDateFromAge(form.childAge), [form.childAge]);
  const input = useMemo<SimulateInput>(() => ({
    giftMethod: form.giftMethod,
    monthlyAmount: form.monthlyAmount,
    startDate: form.startDate,
    endDate,
    paymentDay: form.paymentDay,
    lumpSumAmount: form.lumpSumAmount,
    giftDate: form.giftDate,
    childBirthDate,
    priceGrowthRate: percent(form.priceGrowthRate),
    distributionRate: percent(form.distributionRate),
    withdrawalAge: number(form.withdrawalAge),
  }), [childBirthDate, endDate, form]);
  const calculation = useMemo(() => {
    const errors = validateSimulateInput(input);
    return { errors, result: errors.length === 0 ? simulate(input) : null };
  }, [input]);

  const makeContract = () => {
    saveToContract({
      monthlyAmount: form.monthlyAmount,
      startDate: form.startDate,
      endDate,
      paymentDay: form.paymentDay,
    });
    window.location.href = '/';
  };

  const allAfterTaxEqual = calculation.result
    ? new Set(productTypes.map((type) => calculation.result!.byProduct[type].afterTax)).size === 1
    : false;

  return (
    <main className="container simulator">
      <SiteHeader />
      {handoff && <div className="restored-notice" role="status"><p>계약서에서 입력한 조건을 불러왔어요.</p></div>}
      <h1>자녀 증여자산 시뮬레이터</h1>
      <p className="trust-note">입력한 가정으로 증여 단계와 상품 유형별 세후 금액을 계산합니다.</p>

      <section className="card simulator-form" aria-labelledby="simulator-basic-title">
        <h2 id="simulator-basic-title">기본 조건</h2>
        <div className="simulator-basic-grid">
          <div className="simulator-field">
            <label htmlFor="sim-child-age">아이 나이</label>
            <input id="sim-child-age" type="number" inputMode="numeric" min="0" step="1" value={form.childAge} onChange={(event) => update('childAge', event.target.value)} />
          </div>
          <AmountInput id="sim-monthly-amount" label="매월 증여액" value={form.monthlyAmount} onChange={(value) => update('monthlyAmount', value)} />
          <div className="simulator-field">
            <label htmlFor="sim-gift-years">증여 기간</label>
            <div className="simulator-unit-input"><input id="sim-gift-years" type="number" inputMode="numeric" min="0" step="1" value={form.giftYears} onChange={(event) => update('giftYears', event.target.value)} /><span>년</span></div>
          </div>
        </div>
      </section>

      <section className="card simulator-controls" aria-labelledby="simulator-growth-label">
        <div className="simulator-growth-heading">
          <label id="simulator-growth-label" htmlFor="sim-growth">연 가격상승률</label>
          <output htmlFor="sim-growth">{number(form.priceGrowthRate) > 0 ? '+' : ''}{form.priceGrowthRate}%</output>
        </div>
        <input
          id="sim-growth"
          aria-labelledby="simulator-growth-label"
          type="range"
          min="-10"
          max="10"
          step="0.5"
          value={form.priceGrowthRate}
          onChange={(event) => update('priceGrowthRate', event.target.value)}
        />
      </section>

      {calculation.errors.length > 0 ? (
        <section className="card simulator-errors" aria-labelledby="simulator-errors-title">
          <h2 id="simulator-errors-title">입력값을 확인해 주세요</h2>
          <ul>{calculation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </section>
      ) : calculation.result && (
        <section className="card simulator-summary" data-testid="simulator-result-summary" aria-labelledby="simulator-summary-title">
          <h2 id="simulator-summary-title">상품별 세후 금액</h2>
          <dl>
            {productTypes.map((type) => (
              <div key={type}><dt>{productNames[type]}</dt><dd>{won(calculation.result!.byProduct[type].afterTax)}</dd></div>
            ))}
          </dl>
          {allAfterTaxEqual && <p className="simulator-equal-hint">수익률을 올려보면 상품별 세금 차이가 나타납니다.</p>}
        </section>
      )}

      <details className="card simulator-details">
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
              <AmountInput id="sim-lump-sum" label="증여 금액" value={form.lumpSumAmount} onChange={(value) => update('lumpSumAmount', value)} />
              <div className="simulator-field">
                <label htmlFor="sim-gift-date">증여일</label>
                <input id="sim-gift-date" type="date" value={form.giftDate} onChange={(event) => update('giftDate', event.target.value)} />
              </div>
            </div>
          )}
          <div className="simulator-advanced-grid">
            <div className="simulator-field">
              <label htmlFor="sim-distribution">연 분배율(%)</label>
              <input id="sim-distribution" type="number" inputMode="decimal" min="0" max="100" step="0.1" value={form.distributionRate} onChange={(event) => update('distributionRate', event.target.value)} />
              <p className="simulator-help">ETF가 매년 지급하는 분배금 비율입니다.</p>
            </div>
            <div className="simulator-field">
              <label htmlFor="sim-withdrawal-age">인출 시점(아이 나이)</label>
              <input id="sim-withdrawal-age" type="number" inputMode="numeric" min="0" step="1" value={form.withdrawalAge} onChange={(event) => update('withdrawalAge', event.target.value)} />
            </div>
          </div>
        </div>
      </details>

      {calculation.result && (
        <>
          <section className="simulator-gift-line" aria-label="증여 단계">
            <h2>증여 단계</h2>
            <p>증여 원금 {won(calculation.result.giftPrincipal)} <span>·</span> 평가액 {won(calculation.result.giftValuation)} <span>·</span> 예상 증여세 {won(calculation.result.giftTax.payable)}</p>
          </section>

          <details className="card simulator-details simulator-breakdown">
            <summary>상세 내역</summary>
            <div className="simulator-details-body">
              <dl className="simulator-deduction">
                <div><dt>공제 한도 판정</dt><dd>{calculation.result.deduction.within ? `한도 이내 (${won(calculation.result.deduction.limit)})` : `한도 초과 ${won(calculation.result.deduction.excess)}`}</dd></div>
              </dl>
              <div className="table-scroll">
                <table className="info-table simulator-detail-table">
                  <caption className="simulator-detail-caption">세 항목 모두 ETF 기준입니다.</caption>
                  <thead><tr><th scope="col">항목</th>{productTypes.map((type) => <th scope="col" key={type}>{productShortNames[type]}</th>)}</tr></thead>
                  <tbody>{detailRows.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{productTypes.map((type) => <td key={type}>{won(calculation.result!.byProduct[type][key])}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          </details>

          <p className="guide-note simulator-neutral-note">조건이 바뀌면 결과도 달라집니다. 이 계산은 입력한 가정에 따른 산술 결과이며 투자 권유가 아닙니다.</p>
          {calculation.result.financialIncomeWarning && <p className="warn simulator-warning">국내상장 해외 ETF는 매매차익이 배당소득으로 과세되어 금융소득에 포함됩니다. 연 2,000만 원을 넘으면 종합과세 대상이 될 수 있으며, 이 계산에는 반영되어 있지 않습니다.</p>}

          <details className="card simulator-details simulator-assumptions">
            <summary>계산의 단순화 가정</summary>
            <div className="simulator-details-body"><ul>
              <li>분배금은 세후 전액 재투자한다고 가정합니다.</li>
              <li>증여세는 별도 납부하는 것으로 보고 투자 원금에서 빼지 않았습니다.</li>
              <li>부모가 자녀에게 증여하는 경우를 기준으로 계산합니다.</li>
            </ul></div>
          </details>
          {form.giftMethod === 'annuity' && <button type="button" className="btn-primary simulator-contract-cta" onClick={makeContract}>이 조건으로 계약서 만들기</button>}
        </>
      )}
      <p className="disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
