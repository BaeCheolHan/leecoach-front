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
    <>
      <section className="card">
        <h2>4. 평가 결과</h2>
        <div className="table-scroll">
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
        </div>
        {result.capApplied && <p className="warn">1년분 정기금액의 20배 상한({won(result.cap)})이 적용되었습니다.</p>}

        <div className="judgement">
          <p>
            할인평가액 합계 {won(result.totalDiscounted)} / 공제한도 {won(judgement.limit)}
            {judgement.minorApplied ? ' (미성년자 공제)' : ''} → {' '}
            {judgement.within ? '한도 이내입니다. 예상 증여세는 0원입니다.' : `한도를 ${won(judgement.excess)} 초과합니다. 세무사 검토가 필요합니다.`}
          </p>
          <p className="warn">10년 내 동일인으로부터 받은 기증여가 있으면 합산됩니다.</p>
        </div>
      </section>

      {error && <p role="alert" className="error">{error}</p>}
      <div className="downloads">
        <button type="button" className="btn-primary" onClick={dlContract}>증여계약서 PDF</button>
        <button type="button" className="btn-primary" onClick={dlSchedule}>평가명세서 PDF</button>
        <button type="button" className="btn-primary" onClick={dlBoth}>모두 다운로드</button>
      </div>
      <nav className="step-nav step-nav--even">
        <button type="button" className="btn-secondary" onClick={onBack}>이전</button>
        <button type="button" className="btn-secondary" onClick={() => { clearDraft(); location.reload(); }}>처음부터 다시</button>
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </>
  );
}
