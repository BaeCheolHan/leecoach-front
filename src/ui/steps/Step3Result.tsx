import { useEffect, useMemo, useState } from 'react';
import type { FormValues } from '../schema';
import { evaluateAnnuity } from '../../domain/annuity';
import { judgeDeduction } from '../../domain/giftTax';
import { parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';
import { registerFonts } from '../../pdf/fonts';
import { drawSeal } from '../../pdf/seal';
import { ContractDoc } from '../../pdf/ContractDoc';
import { ScheduleDoc } from '../../pdf/ScheduleDoc';
import { pdfFileName, renderPdfBlob, savePdfFiles } from '../../pdf/download';
import { clearDraft } from '../../storage/draft';
import { DISCLAIMER, TAX_MIN_THRESHOLD } from '../../config';

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

export function Step3Result({ values, onBack }: { values: FormValues; onBack: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const result = useMemo(() => evaluateAnnuity(values.terms), [values.terms]);
  const doneeInfo = parseRrn(values.donee.rrn);
  const doneeBirth = doneeInfo?.birthDate ?? '';
  const minor = doneeBirth ? isMinor(doneeBirth, values.terms.startDate) : false;
  const judgement = judgeDeduction(result.totalDiscounted, values.donee.relation, minor);
  const today = new Date().toISOString().slice(0, 10);

  const makeContract = () => {
    const donorSeal = drawSeal(values.donor.name);
    const doneeSeal = drawSeal(values.donee.name);
    return (
      <ContractDoc values={values} result={result} donorSeal={donorSeal} doneeSeal={doneeSeal}
        madeDate={values.terms.startDate} />
    );
  };
  const makeSchedule = () => (
    <ScheduleDoc values={values} result={result} doneeBirthDate={doneeBirth} isDoneeMinor={minor} />
  );

  // 진입 즉시 PDF를 미리 만들어 캐시 — 버튼 클릭 시 터치 활성화가 살아있는 동안
  // 바로 저장/공유해야 iOS에서 차단되지 않는다 (savePdfFiles 주석 참조)
  const [blobs, setBlobs] = useState<{ contract: Blob; schedule: Blob } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        registerFonts();
        const contract = await renderPdfBlob(makeContract());
        const schedule = await renderPdfBlob(makeSchedule());
        if (alive) setBlobs({ contract, schedule });
      } catch {
        if (alive) setError('PDF 생성에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contractName = pdfFileName('증여계약서', values.donee.name, today);
  const scheduleName = pdfFileName('유기정기금평가명세서', values.donee.name, today);

  const save = (items: { blob: Blob; filename: string }[]) => async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await savePdfFiles(items);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };
  const dlContract = blobs ? save([{ blob: blobs.contract, filename: contractName }]) : undefined;
  const dlSchedule = blobs ? save([{ blob: blobs.schedule, filename: scheduleName }]) : undefined;
  const dlBoth = blobs
    ? save([
        { blob: blobs.contract, filename: contractName },
        { blob: blobs.schedule, filename: scheduleName },
      ])
    : undefined;

  return (
    <>
      <section className="card">
        <h2>4. 평가 결과</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>{['년도', '년차', '횟수(월)', '원금', '할인평가액'].map((h) => <th key={h}>{h}</th>)}</tr>
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
            {judgement.within
              ? '한도 이내입니다. 예상 증여세는 0원입니다.'
              : judgement.underTaxMin
                ? `한도를 ${won(judgement.excess)} 초과하나, 과세표준이 과세최저한(${won(TAX_MIN_THRESHOLD)}) 미만이므로 증여세가 부과되지 않습니다.`
                : `한도를 ${won(judgement.excess)} 초과합니다. 세무사 검토가 필요합니다.`}
          </p>
          <p className="warn">10년 내 동일인으로부터 받은 기증여가 있으면 합산됩니다.</p>
          {values.donee.relation === '기타' && (
            <p className="warn">
              ※ 6촌 이내 혈족·4촌 이내 인척이 아닌 타인 간 증여는 증여재산공제가 적용되지 않습니다.
            </p>
          )}
        </div>
      </section>

      {error && <p role="alert" className="error">{error}</p>}
      {!blobs && !error && <p className="status">문서 준비 중…</p>}
      <div className="downloads">
        <button type="button" className="btn-primary" disabled={busy || !blobs} onClick={dlContract}>증여계약서 PDF</button>
        <button type="button" className="btn-primary" disabled={busy || !blobs} onClick={dlSchedule}>평가명세서 PDF</button>
        <button type="button" className="btn-primary" disabled={busy || !blobs} onClick={dlBoth}>모두 다운로드</button>
      </div>
      <a className="next-guide" href="/guide/annuity-gift-report">
        <b>다음 단계는 홈택스 신고입니다</b>
        <span>서류 첨부부터 제출까지, 신고 방법 가이드 보기 →</span>
      </a>
      <nav className="step-nav step-nav--even">
        <button type="button" className="btn-secondary" onClick={onBack}>이전</button>
        <button type="button" className="btn-secondary" onClick={() => { clearDraft(); location.reload(); }}>처음부터 다시</button>
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </>
  );
}
