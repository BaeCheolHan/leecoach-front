import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormValues } from '../schema';
import { formatRrnInput, parseRrn } from '../../domain/rrn';
import { isMinor } from '../../domain/age';

const RELATIONS = ['부', '모', '자', '손', '조부', '조모', '배우자', '기타'] as const;
const RELATION_LABELS: Record<(typeof RELATIONS)[number], string> = {
  부: '부',
  모: '모',
  자: '자',
  손: '손',
  조부: '조부',
  조모: '조모',
  배우자: '배우자',
  기타: '기타친족(6촌 이내 혈족·4촌 이내 인척)',
};

export function Step1Parties() {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<FormValues>();
  const doneeRrn = watch('donee.rrn');
  const startDate = watch('terms.startDate');
  const donorName = watch('donor.name');
  const info = parseRrn(doneeRrn ?? '');
  const baseDate = startDate || new Date().toISOString().slice(0, 10);
  const doneeMinor = info ? isMinor(info.birthDate, baseDate) : false;

  useEffect(() => {
    if (doneeMinor && !getValues('donee.legalRepName')) {
      setValue('donee.legalRepName', donorName ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneeMinor]);

  // 숫자만 눌러도 하이픈이 자동 삽입되도록 주민등록번호 입력을 정규화
  const rrnField = (name: 'donor.rrn' | 'donee.rrn') => ({
    ...register(name, {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setValue(name, formatRrnInput(e.target.value)),
    }),
    inputMode: 'numeric' as const,
    placeholder: '000000-0000000',
    maxLength: 14,
    autoComplete: 'off',
    spellCheck: false,
  });

  return (
    <>
      <section className="card">
        <h2>1. 증여자(돈 주는 사람)</h2>
        <label htmlFor="donor-name">증여자 성명</label>
        <input id="donor-name" {...register('donor.name')} />
        {errors.donor?.name && <p role="alert">{errors.donor.name.message}</p>}

        <label htmlFor="donor-rrn">증여자 주민등록번호</label>
        <input id="donor-rrn" {...rrnField('donor.rrn')} />
        {errors.donor?.rrn && <p role="alert">{errors.donor.rrn.message}</p>}

        <label htmlFor="donor-address">증여자 주소</label>
        <input id="donor-address" autoComplete="off" spellCheck={false} {...register('donor.address')} />
        {errors.donor?.address && <p role="alert">{errors.donor.address.message}</p>}

        <label htmlFor="donor-phone">증여자 연락처</label>
        <input id="donor-phone" autoComplete="off" spellCheck={false} {...register('donor.phone')} />
      </section>

      <section className="card">
        <h2>2. 수증자(돈 받는 사람)</h2>
        <label htmlFor="donee-relation">증여자와의 관계</label>
        <select id="donee-relation" {...register('donee.relation')}>
          <option value="">선택하세요</option>
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {RELATION_LABELS[r]}
            </option>
          ))}
        </select>
        {errors.donee?.relation && <p role="alert">{errors.donee.relation.message}</p>}

        <label htmlFor="donee-name">수증자 성명</label>
        <input id="donee-name" {...register('donee.name')} />
        {errors.donee?.name && <p role="alert">{errors.donee.name.message}</p>}

        <label htmlFor="donee-rrn">수증자 주민등록번호</label>
        <input id="donee-rrn" {...rrnField('donee.rrn')} />
        {errors.donee?.rrn && <p role="alert">{errors.donee.rrn.message}</p>}

        <label htmlFor="donee-address">수증자 주소</label>
        <input id="donee-address" autoComplete="off" spellCheck={false} {...register('donee.address')} />
        {errors.donee?.address && <p role="alert">{errors.donee.address.message}</p>}

        <label htmlFor="donee-phone">수증자 연락처</label>
        <input id="donee-phone" autoComplete="off" spellCheck={false} {...register('donee.phone')} />

        {doneeMinor && (
          <>
            <label htmlFor="legal-rep">법정대리인 성명</label>
            <input
              id="legal-rep"
              placeholder="미성년 수증자를 대리하여 날인할 친권자"
              {...register('donee.legalRepName')}
            />
          </>
        )}
      </section>
    </>
  );
}
