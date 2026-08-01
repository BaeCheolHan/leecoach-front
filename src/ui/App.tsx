import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormValues } from './schema';
import { loadDraft, saveDraft } from '../storage/draft';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { SiteHeader } from './SiteHeader';
import { Step1Parties } from './steps/Step1Parties';
import { Step2Terms } from './steps/Step2Terms';
import { Step3Result } from './steps/Step3Result';
import './App.css';

const STEP1_FIELDS = ['donor', 'donee'] as const;
const STEP2_FIELDS = ['terms'] as const;

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft] = useState(() => loadDraft());
  // 의미 있는 내용이 복원됐을 때만 안내 (빈 초안 저장분은 제외)
  const [showRestored, setShowRestored] = useState(
    () => !!(draft && (draft.donor?.name || draft.donee?.name || draft.terms?.monthlyAmount)),
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: draft ?? {
      donor: { name: '', rrn: '', address: '', phone: '' },
      donee: { name: '', rrn: '', address: '', phone: '', relation: undefined as never },
      terms: { startDate: '', endDate: '', method: '자동이체', paymentDay: 1, monthlyAmount: 0, bank: '', account: '' },
    },
  });

  // debounce 자동 저장 (주민번호는 draft.ts가 제거)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = form.watch((v) => {
      clearTimeout(timer);
      timer = setTimeout(() => saveDraft(v as FormValues), 500);
    });
    return () => {
      clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [form]);

  // 단계 전환 시 이전 단계의 스크롤 위치가 남지 않도록 최상단으로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const next = async () => {
    const fields = step === 1 ? STEP1_FIELDS : STEP2_FIELDS;
    if (await form.trigger([...fields])) setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
  };

  return (
    <FormProvider {...form}>
      <main className="container">
        <SiteHeader />
        <InAppBrowserNotice />
        {step === 1 && (
          <a className="first-timer" href="/guide/annuity-gift-report">
            유기정기금 증여가 처음이신가요? <b>가이드 먼저 보기 →</b>
          </a>
        )}
        {step === 1 && showRestored && (
          <div className="restored-notice" role="status">
            <p>
              이전에 작성하던 내용을 불러왔어요. <b>주민등록번호는 보안을 위해 저장하지 않으므로</b> 다시
              입력해 주세요.
            </p>
            <button type="button" aria-label="안내 닫기" onClick={() => setShowRestored(false)}>
              ✕
            </button>
          </div>
        )}
        <h1>유기정기금 증여계약서 · 평가명세서</h1>
        <p className="step-indicator">{step}/3</p>
        {step < 3 && (
          <p className="req-legend">
            <b>*</b> 표시는 필수 입력입니다
          </p>
        )}
        {step === 1 && <Step1Parties />}
        {step === 2 && <Step2Terms />}
        {step === 3 && <Step3Result values={form.getValues()} onBack={() => setStep(2)} />}
        {step < 3 && (
          <nav className={`step-nav${step > 1 ? ' step-nav--split' : ''}`}>
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>
                이전
              </button>
            )}
            <button type="button" className="btn-primary" onClick={next}>
              다음
            </button>
          </nav>
        )}
        <p className="footer-links">
          <a href="/guide">증여 가이드</a> · <a href="/privacy">개인정보처리방침</a>
        </p>
      </main>
    </FormProvider>
  );
}
