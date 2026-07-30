import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormValues } from './schema';
import { loadDraft, saveDraft } from '../storage/draft';
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
      donee: { name: '', rrn: '', address: '', phone: '', relation: undefined as never, legalRepName: '' },
      terms: { startDate: '', endDate: '', method: '자동이체', paymentDay: 1, monthlyAmount: 0, bank: '', account: '' },
    },
  });

  // debounce 자동 저장 (주민번호는 draft.ts가 제거)
  useEffect(() => {
    const sub = form.watch((v) => {
      const t = setTimeout(() => saveDraft(v as FormValues), 500);
      return () => clearTimeout(t);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const next = async () => {
    const fields = step === 1 ? STEP1_FIELDS : STEP2_FIELDS;
    if (await form.trigger([...fields])) setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
  };

  return (
    <FormProvider {...form}>
      <main className="container">
        <h1>유기정기금 증여계약서 · 평가명세서 생성</h1>
        {step === 1 && <Step1Parties />}
        {step === 2 && <Step2Terms />}
        {step === 3 && <Step3Result values={form.getValues()} onBack={() => setStep(2)} />}
        {step < 3 && (
          <nav className="step-nav">
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>
                이전
              </button>
            )}
            <button type="button" onClick={next}>
              다음
            </button>
          </nav>
        )}
      </main>
    </FormProvider>
  );
}
