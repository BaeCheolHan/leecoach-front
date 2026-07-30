import { useFormContext } from 'react-hook-form';
import type { FormValues } from '../schema';
import { parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';
import { ADULT_AGE } from '../../config';

function addYears(date: string, years: number): string {
  return `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
}

export function Step2Terms() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<FormValues>();
  const [startDate, endDate, method, doneeRrn] = watch([
    'terms.startDate',
    'terms.endDate',
    'terms.method',
    'donee.rrn',
  ]);
  const over10y = !!startDate && !!endDate && endDate > addYears(startDate, 10);

  const info = parseRrn(doneeRrn ?? '');
  const baseDate = startDate || new Date().toISOString().slice(0, 10);
  const doneeMinorAtStart = info ? isMinor(info.birthDate, baseDate) : false;
  const turningAdultDate = info ? addYears(info.birthDate, ADULT_AGE) : '';
  const reachesAdultDuringTerm =
    doneeMinorAtStart && !!startDate && !!endDate && turningAdultDate >= startDate && turningAdultDate <= endDate;

  return (
    <section>
      <h2>3. 증여내용</h2>
      <label htmlFor="start">증여시작일</label>
      <input id="start" type="date" {...register('terms.startDate')} />
      <label htmlFor="end">증여종료일</label>
      <input id="end" type="date" {...register('terms.endDate')} />
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
      <label htmlFor="method">증여방법</label>
      <select id="method" {...register('terms.method')}>
        <option>자동이체</option>
        <option>직접이체</option>
        <option value="기타">기타 직접입력</option>
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
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
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
