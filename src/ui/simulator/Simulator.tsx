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
import { koreanAmount } from '../format';
import { SiteHeader } from '../SiteHeader';
import { usePageMeta } from '../usePageMeta';

const META = {
  title: '자녀 증여자산 시뮬레이터 — 세후 얼마가 남을까 | 이코치맘',
  description: '증여한 돈이 아이가 자랄 때까지 얼마가 되고 세금이 얼마나 붙는지, 조건을 넣어 직접 계산해 보세요. 상품 유형별 세후 금액을 나란히 비교합니다.',
  path: '/simulator',
};

const productNames: Record<ProductType, string> = {
  domesticEquityEtf: '국내 상장 ETF(국내주식형)',
  domesticForeignEtf: '국내 상장 해외 ETF',
  overseasEtf: '해외 상장 ETF',
};

const won = (value: number) => `₩${Math.round(value).toLocaleString('ko-KR')}`;
const percentNumber = (value: string) => value.trim() === '' ? Number.NaN : Number(value) / 100;
const numericValue = (value: string) => value.trim() === '' ? Number.NaN : Number(value);

/**
 * 아직 채우지 않은 필수 항목이 있는지. 손대지 않은 폼에 오류 목록을 띄우면 첫인상이 나쁘므로
 * "아직 안 채움"과 "잘못 채움"을 구분해 전자는 안내로, 후자만 오류로 보여준다.
 */
function hasEmptyRequiredField(form: FormState): boolean {
  const commonEmpty = form.childBirthDate === ''
    || form.priceGrowthRate.trim() === ''
    || form.distributionRate.trim() === ''
    || form.withdrawalAge.trim() === '';
  const methodEmpty = form.giftMethod === 'annuity'
    ? form.monthlyAmount <= 0 || form.startDate === '' || form.endDate === ''
    : form.lumpSumAmount <= 0 || form.giftDate === '';
  return commonEmpty || methodEmpty;
}

interface FormState {
  giftMethod: 'annuity' | 'lumpSum';
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  paymentDay: number;
  lumpSumAmount: number;
  giftDate: string;
  childBirthDate: string;
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
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="500,000"
        value={value > 0 ? value.toLocaleString('ko-KR') : ''}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
          onChange(digits ? Number(digits) : 0);
        }}
      />
      {value > 0 && <p className="amount-hint">{koreanAmount(value)}</p>}
    </>
  );
}

function ProductCard({ name, result }: { name: string; result: ProductResult }) {
  const rows = [
    ['성장 후 평가액', result.finalValue],
    ['매매차익', result.capitalGain],
    ['분배금 세금', result.distributionTax],
    ['매도 세금', result.saleTax],
    ['세후 금액', result.afterTax],
  ] as const;
  return (
    <article className="card simulator-product">
      <h3>{name}</h3>
      <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{won(value)}</dd></div>)}</dl>
    </article>
  );
}

export function Simulator() {
  usePageMeta(META);
  const [handoff] = useState(() => loadToSimulator());
  const [form, setForm] = useState<FormState>(() => ({
    giftMethod: 'annuity',
    monthlyAmount: handoff?.monthlyAmount ?? 0,
    startDate: handoff?.startDate ?? '',
    endDate: handoff?.endDate ?? '',
    paymentDay: handoff?.paymentDay ?? 1,
    lumpSumAmount: 0,
    giftDate: '',
    childBirthDate: handoff?.childBirthDate ?? '',
    priceGrowthRate: '',
    distributionRate: '',
    withdrawalAge: '19',
  }));
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const input = useMemo<SimulateInput>(() => ({
    giftMethod: form.giftMethod,
    monthlyAmount: form.monthlyAmount,
    startDate: form.startDate,
    endDate: form.endDate,
    paymentDay: form.paymentDay,
    lumpSumAmount: form.lumpSumAmount,
    giftDate: form.giftDate,
    childBirthDate: form.childBirthDate,
    priceGrowthRate: percentNumber(form.priceGrowthRate),
    distributionRate: percentNumber(form.distributionRate),
    withdrawalAge: numericValue(form.withdrawalAge),
  }), [form]);
  const incomplete = hasEmptyRequiredField(form);
  const calculation = useMemo(() => {
    if (hasEmptyRequiredField(form)) return { errors: [], result: null };
    const errors = validateSimulateInput(input);
    return { errors, result: errors.length === 0 ? simulate(input) : null };
  }, [input, form]);

  /** 유기정기금 조건만 계약서 도구로 넘긴다 (도구가 유기정기금 전용). */
  const makeContract = () => {
    saveToContract({
      monthlyAmount: form.monthlyAmount,
      startDate: form.startDate,
      endDate: form.endDate,
      paymentDay: form.paymentDay,
    });
    window.location.href = '/';
  };

  return (
    <main className="container simulator">
      <SiteHeader />
      {handoff && <div className="restored-notice" role="status"><p>계약서에서 입력한 조건을 불러왔어요.</p></div>}
      <h1>자녀 증여자산 시뮬레이터</h1>
      <p className="trust-note">입력한 가정으로 증여 단계와 상품 유형별 세후 금액을 계산합니다.</p>

      <section className="card simulator-form">
        <h2>계산 조건</h2>
        <fieldset className="simulator-method">
          <legend>증여 방식</legend>
          <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'annuity'} onChange={() => update('giftMethod', 'annuity')} /> 유기정기금</label>
          <label><input type="radio" name="sim-gift-method" checked={form.giftMethod === 'lumpSum'} onChange={() => update('giftMethod', 'lumpSum')} /> 현금 일시금</label>
        </fieldset>
        {form.giftMethod === 'annuity' ? (
          <>
            <AmountInput id="sim-monthly-amount" label="매월 증여액(원)" value={form.monthlyAmount} onChange={(v) => update('monthlyAmount', v)} />
            <label htmlFor="sim-start-date">증여 시작일</label>
            <input id="sim-start-date" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
            <label htmlFor="sim-end-date">증여 종료일</label>
            <input id="sim-end-date" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
            <label htmlFor="sim-payment-day">매월 지급일</label>
            <select id="sim-payment-day" value={form.paymentDay} onChange={(e) => update('paymentDay', Number(e.target.value))}>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}일</option>)}
            </select>
          </>
        ) : (
          <>
            <AmountInput id="sim-lump-sum" label="증여 금액(원)" value={form.lumpSumAmount} onChange={(v) => update('lumpSumAmount', v)} />
            <label htmlFor="sim-gift-date">증여일</label>
            <input id="sim-gift-date" type="date" value={form.giftDate} onChange={(e) => update('giftDate', e.target.value)} />
          </>
        )}
        <label htmlFor="sim-child-birth">아이 생년월일</label>
        <input id="sim-child-birth" type="date" value={form.childBirthDate} onChange={(e) => update('childBirthDate', e.target.value)} />
        <div className="simulator-rate-grid">
          <div><label htmlFor="sim-growth">연 가격상승률(%)</label><input id="sim-growth" type="number" inputMode="decimal" min="-100" max="100" step="any" placeholder="예: 5" value={form.priceGrowthRate} onChange={(e) => update('priceGrowthRate', e.target.value)} /></div>
          <div><label htmlFor="sim-distribution">연 분배율(%)</label><input id="sim-distribution" type="number" inputMode="decimal" min="0" max="100" step="any" placeholder="예: 2" value={form.distributionRate} onChange={(e) => update('distributionRate', e.target.value)} /></div>
        </div>
        <label htmlFor="sim-withdrawal-age">인출 시점(아이 나이)</label>
        <input id="sim-withdrawal-age" type="number" inputMode="decimal" min="0" step="1" value={form.withdrawalAge} onChange={(e) => update('withdrawalAge', e.target.value)} />
      </section>

      {incomplete ? (
        <section className="card simulator-empty" role="status">
          <p>조건을 모두 입력하면 결과가 나타납니다.</p>
        </section>
      ) : calculation.errors.length > 0 ? (
        <section className="card simulator-errors" aria-labelledby="simulator-errors-title">
          <h2 id="simulator-errors-title">입력값을 확인해 주세요</h2>
          <ul>{calculation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </section>
      ) : calculation.result && (
        <>
          <section className="card simulator-gift-result">
            <h2>증여 단계</h2>
            <dl>
              <div><dt>증여 원금</dt><dd>{won(calculation.result.giftPrincipal)}</dd></div>
              <div><dt>증여재산 평가액</dt><dd>{won(calculation.result.giftValuation)}</dd></div>
              <div><dt>공제 한도 판정</dt><dd>{calculation.result.deduction.within ? `한도 이내 (${won(calculation.result.deduction.limit)})` : `한도 초과 ${won(calculation.result.deduction.excess)}`}</dd></div>
              <div><dt>예상 증여세</dt><dd>{won(calculation.result.giftTax.payable)}</dd></div>
            </dl>
          </section>
          <p className="guide-note simulator-neutral-note">조건이 바뀌면 결과도 달라집니다. 이 계산은 입력한 가정에 따른 산술 결과이며 투자 권유가 아닙니다.</p>
          {calculation.result.financialIncomeWarning && <p className="warn simulator-warning">금융소득이 연 2,000만 원을 넘으면 종합과세 대상이 될 수 있습니다. 이 계산에는 종합과세가 반영되어 있지 않습니다.</p>}
          <section aria-labelledby="product-results-title">
            <h2 id="product-results-title" className="simulator-section-title">상품 유형별 결과</h2>
            <div className="simulator-products">
              {(Object.entries(calculation.result.byProduct) as [ProductType, ProductResult][]).map(([type, result]) => <ProductCard key={type} name={productNames[type]} result={result} />)}
            </div>
          </section>
          <section className="card simulator-assumptions">
            <h2>계산의 단순화 가정</h2>
            <ul>
              <li>분배금은 세후 전액 재투자한다고 가정합니다.</li>
              <li>증여세는 별도 납부하는 것으로 보고 투자 원금에서 빼지 않았습니다.</li>
              <li>부모가 자녀에게 증여하는 경우를 기준으로 계산합니다.</li>
            </ul>
          </section>
          {/* 계약서 도구는 유기정기금 전용이므로 일시금 조건으로는 넘기지 않는다. */}
          {form.giftMethod === 'annuity' && (
            <button type="button" className="btn-primary simulator-contract-cta" onClick={makeContract}>이 조건으로 계약서 만들기</button>
          )}
        </>
      )}
      <p className="disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
