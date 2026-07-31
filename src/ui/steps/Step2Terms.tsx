import { useFormContext } from 'react-hook-form';
import type { FormValues } from '../schema';
import { parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';
import { evaluateAnnuity } from '../../domain/annuity';
import { ADULT_AGE, DISCOUNT_RATE } from '../../config';
import { koreanAmount } from '../format';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function addYears(date: string, years: number): string {
  return `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
}

/** 다음 날 (YYYY-MM-DD) — 종료일 달력의 최소 선택 가능일로 사용 */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Step2Terms() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const [startDate, endDate, method, doneeRrn, paymentDay, monthlyAmount] = watch([
    'terms.startDate',
    'terms.endDate',
    'terms.method',
    'donee.rrn',
    'terms.paymentDay',
    'terms.monthlyAmount',
  ]);
  const over10y = !!startDate && !!endDate && endDate > addYears(startDate, 10);

  // 입력이 유효해지는 즉시 총 회수·총액을 미리 보여준다 (실수 조기 발견용)
  const previewReady =
    DATE_RE.test(startDate ?? '') && DATE_RE.test(endDate ?? '') && startDate < endDate && monthlyAmount > 0;
  const preview = previewReady
    ? evaluateAnnuity({ startDate, endDate, paymentDay: paymentDay || 1, monthlyAmount })
    : null;
  const totalPayments = preview ? preview.rows.reduce((s, r) => s + r.payments, 0) : 0;

  const info = parseRrn(doneeRrn ?? '');
  const baseDate = startDate || new Date().toISOString().slice(0, 10);
  const doneeMinorAtStart = info ? isMinor(info.birthDate, baseDate) : false;
  const turningAdultDate = info ? addYears(info.birthDate, ADULT_AGE) : '';
  const reachesAdultDuringTerm =
    doneeMinorAtStart && !!startDate && !!endDate && turningAdultDate >= startDate && turningAdultDate <= endDate;

  return (
    <section className="card">
      <h2>3. 증여내용</h2>
      <label htmlFor="start" className="req">증여시작일</label>
      <input id="start" type="date" {...register('terms.startDate')} />
      {errors.terms?.startDate && <p role="alert">{errors.terms.startDate.message}</p>}
      <label htmlFor="end" className="req">증여종료일</label>
      <input
        id="end"
        type="date"
        min={DATE_RE.test(startDate ?? '') ? nextDay(startDate) : undefined}
        {...register('terms.endDate')}
      />
      {errors.terms?.endDate && <p role="alert">{errors.terms.endDate.message}</p>}
      {over10y && (
        <p className="warn">
          증여재산공제는 10년 단위로 통산됩니다. 10년을 초과하는 기간은 공제 계획과 어긋날 수 있습니다.
        </p>
      )}
      {reachesAdultDuringTerm && (
        <p className="warn">
          수증자가 증여 기간 중 성년이 됩니다. 미성년 여부는 증여시작일 기준으로 판정했습니다. 참고 구현과 판정
          방식(만 나이)이 다를 수 있으니 세무사 검토를 권합니다.
        </p>
      )}
      <label htmlFor="method" className="req">증여방법</label>
      <select id="method" {...register('terms.method')}>
        <option>자동이체</option>
        <option>직접이체</option>
        <option value="기타">기타 직접입력</option>
      </select>
      {method === '기타' && (
        <>
          <label htmlFor="method-etc" className="req">증여방법 직접입력</label>
          <input id="method-etc" {...register('terms.methodEtc')} />
          {errors.terms?.methodEtc && <p role="alert">{errors.terms.methodEtc.message}</p>}
        </>
      )}
      <label htmlFor="payday" className="req">매월 지급일</label>
      <select id="payday" {...register('terms.paymentDay', { valueAsNumber: true })}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
      </select>
      <label htmlFor="amount" className="req">매월 증여액(원)</label>
      <input
        id="amount"
        inputMode="numeric"
        autoComplete="off"
        placeholder="500,000"
        value={monthlyAmount > 0 ? monthlyAmount.toLocaleString('ko-KR') : ''}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
          setValue('terms.monthlyAmount', digits ? Number(digits) : 0, { shouldDirty: true });
        }}
      />
      {monthlyAmount > 0 && <p className="amount-hint">{koreanAmount(monthlyAmount)}</p>}
      {errors.terms?.monthlyAmount && <p role="alert">{errors.terms.monthlyAmount.message}</p>}
      {preview && (
        <p className="preview-total">
          총 {totalPayments}회 · 원금 {koreanAmount(preview.totalPrincipal)}
          <br />
          할인평가액(연 {DISCOUNT_RATE * 100}%) <b>{koreanAmount(preview.totalDiscounted)}</b>
          {preview.capApplied ? ' — 20배 상한 적용' : ''}
        </p>
      )}
      <label htmlFor="bank" className="req">은행/증권사</label>
      <input id="bank" {...register('terms.bank')} />
      {errors.terms?.bank && <p role="alert">{errors.terms.bank.message}</p>}
      <label htmlFor="account" className="req">계좌번호</label>
      <input id="account" {...register('terms.account')} />
      {errors.terms?.account && <p role="alert">{errors.terms.account.message}</p>}
    </section>
  );
}
