import { lazy, Suspense, useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormValues } from './schema';
import { loadDraft, saveDraft } from '../storage/draft';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { SiteHeader } from './SiteHeader';
import { Step1Parties } from './steps/Step1Parties';
import { Step2Terms } from './steps/Step2Terms';
import './App.css';
import { SiteFooter } from './SiteFooter';

const Step3Result = lazy(() => import('./steps/Step3Result').then((m) => ({ default: m.Step3Result })));

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

  // 브라우저 뒤로가기 = 이전 단계 (모바일 뒤로가기 제스처로 사이트를 이탈하지 않도록)
  useEffect(() => {
    history.replaceState({ step: 1 }, '');
    const onPop = (e: PopStateEvent) => {
      const s = e.state?.step;
      if (s === 1 || s === 2 || s === 3) setStep(s);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goTo = (s: 1 | 2 | 3) => {
    history.pushState({ step: s }, '');
    setStep(s);
  };

  const next = async () => {
    const fields = step === 1 ? STEP1_FIELDS : STEP2_FIELDS;
    if (await form.trigger([...fields])) {
      goTo(Math.min(step + 1, 3) as 1 | 2 | 3);
      return;
    }
    // 검증 실패: 화면 밖에 있는 첫 에러로 스크롤하고 해당 입력에 포커스
    // (setTimeout — 에러 메시지가 DOM에 커밋된 다음 프레임에 실행되도록)
    setTimeout(() => {
      const alert = document.querySelector('[role="alert"]');
      if (!alert) return;
      const input = alert.previousElementSibling;
      if (input instanceof HTMLElement) input.focus({ preventScroll: true });
      alert.scrollIntoView?.({ block: 'center' });
    }, 50);
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
        {step === 1 && (
          <p className="trust-note">
            이름·금액·기간만 입력하면 PDF가 완성됩니다. 입력한 모든 정보는{' '}
            <b>내 브라우저 안에서만 처리되고 서버로 전송되지 않아요.</b>
          </p>
        )}
        <p className="step-indicator">{step}/3</p>
        {step < 3 && (
          <p className="req-legend">
            <b>*</b> 표시는 필수 입력입니다
          </p>
        )}
        {step === 1 && <Step1Parties />}
        {step === 2 && <Step2Terms />}
        {step === 3 && (
          <Suspense fallback={<p className="status">문서 준비 중…</p>}>
            <Step3Result values={form.getValues()} onBack={() => history.back()} />
          </Suspense>
        )}
        {step < 3 && (
          <nav className={`step-nav${step > 1 ? ' step-nav--split' : ''}`}>
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={() => history.back()}>
                이전
              </button>
            )}
            <button type="button" className="btn-primary" onClick={next}>
              다음
            </button>
          </nav>
        )}
        <SiteFooter />
      </main>
    </FormProvider>
  );
}
