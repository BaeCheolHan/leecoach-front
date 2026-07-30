import type { FormValues } from '../schema';

export function Step3Result({ values, onBack }: { values: FormValues; onBack: () => void }) {
  void values;
  return (
    <section>
      <p>결과 화면 준비 중</p>
      <button type="button" onClick={onBack}>
        이전
      </button>
    </section>
  );
}
