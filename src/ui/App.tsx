import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormValues } from './schema';
import { loadDraft, saveDraft } from '../storage/draft';
import { InAppBrowserNotice } from './InAppBrowserNotice';
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
        <nav className="top-nav">
          <span className="top-nav-brand">이코치맘</span>
          <a href="/guide">증여 가이드</a>
        </nav>
        <InAppBrowserNotice />
        {step === 1 && (
          <a className="first-timer" href="/guide/annuity-gift-report">
            유기정기금 증여가 처음이신가요? <b>가이드 먼저 보기 →</b>
          </a>
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
