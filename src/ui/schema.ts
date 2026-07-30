import { z } from 'zod';
import { parseRrn } from '../domain/rrn';

const rrn = z.string().refine((v) => parseRrn(v) !== null, '유효한 주민등록번호가 아닙니다 (000000-0000000)');

export const partySchema = z.object({
  name: z.string().min(1, '성명을 입력하세요'),
  rrn,
  address: z.string().min(1, '주소를 입력하세요'),
  phone: z.string(), // 선택 입력
});

const RELATIONS = ['부', '모', '자', '손', '조부', '조모', '배우자', '기타'] as const;

export const doneeSchema = partySchema.extend({
  relation: z.enum(RELATIONS, { message: '관계를 선택하세요' }),
  legalRepName: z.string().optional(), // 미성년 수증자의 법정대리인 성명
});

const METHODS = ['자동이체', '직접이체', '기타'] as const;
export type GiftMethod = (typeof METHODS)[number];

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식으로 입력하세요');

export const termsSchema = z
  .object({
    startDate: dateStr,
    endDate: dateStr,
    method: z.enum(METHODS),
    methodEtc: z.string().optional(),
    paymentDay: z.number().int().min(1).max(31),
    monthlyAmount: z.number().int().positive('매월 증여액을 입력하세요'),
    bank: z.string().min(1, '은행/증권사를 입력하세요'),
    account: z.string().min(1, '계좌번호를 입력하세요'),
  })
  .refine((t) => t.startDate < t.endDate, { message: '종료일은 시작일 이후여야 합니다', path: ['endDate'] })
  .refine((t) => t.method !== '기타' || !!t.methodEtc?.trim(), { message: '증여방법을 입력하세요', path: ['methodEtc'] });

export const formSchema = z.object({
  donor: partySchema,
  donee: doneeSchema,
  terms: termsSchema,
});

export type FormValues = z.infer<typeof formSchema>;
export type Party = z.infer<typeof partySchema>;
export type Donee = z.infer<typeof doneeSchema>;
export type Terms = z.infer<typeof termsSchema>;
