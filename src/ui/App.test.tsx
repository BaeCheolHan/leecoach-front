// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { CONTRACT_HANDOFF_KEY } from '../storage/simHandoff';
import { DRAFT_KEY } from '../storage/draft';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('App 스텝 흐름', () => {
  it('1단계에서 빈 폼으로 다음을 누르면 검증 메시지가 뜬다', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findAllByText(/입력하세요|아닙니다|선택하세요/)).not.toHaveLength(0);
    expect(screen.getByText('1. 증여자(돈 주는 사람)')).toBeTruthy(); // 스텝 이동 안 됨
  });

  it('1단계 유효 입력 후 2단계로 진행한다', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('증여자 성명'), '홍길동');
    await userEvent.type(screen.getByLabelText('증여자 주민등록번호'), '800101-1000008');
    await userEvent.type(screen.getByLabelText('증여자 주소'), '서울시 강남구');
    await userEvent.selectOptions(screen.getByLabelText('증여자와의 관계'), '자');
    await userEvent.type(screen.getByLabelText('수증자 성명'), '홍아기');
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    await userEvent.type(screen.getByLabelText('수증자 주소'), '서울시 강남구');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText('3. 증여내용')).toBeTruthy();
  });

  it('2단계에서 빈 폼으로 다음을 누르면 시작일/은행/계좌 검증 메시지가 뜬다', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('증여자 성명'), '홍길동');
    await userEvent.type(screen.getByLabelText('증여자 주민등록번호'), '800101-1000008');
    await userEvent.type(screen.getByLabelText('증여자 주소'), '서울시 강남구');
    await userEvent.selectOptions(screen.getByLabelText('증여자와의 관계'), '자');
    await userEvent.type(screen.getByLabelText('수증자 성명'), '홍아기');
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    await userEvent.type(screen.getByLabelText('수증자 주소'), '서울시 강남구');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByText('3. 증여내용')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect((await screen.findAllByText('YYYY-MM-DD 형식으로 입력하세요')).length).toBeGreaterThan(0);
    expect(await screen.findByText('은행/증권사를 입력하세요')).toBeTruthy();
    expect(await screen.findByText('계좌번호를 입력하세요')).toBeTruthy();
    expect(screen.getByText('3. 증여내용')).toBeTruthy(); // 스텝 이동 안 됨
  });

  it('관계 선택지에 "기타"는 기타친족 안내 문구로 표시된다', () => {
    render(<App />);
    const option = screen.getByRole('option', { name: /기타친족/ }) as HTMLOptionElement;
    expect(option.value).toBe('기타');
  });

  it('draft 당사자는 유지하고 더 최근 의도인 핸드오프 조건을 우선한다', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      donor: { name: '홍길동', rrn: '', address: '서울', phone: '' },
      donee: { name: '홍아기', rrn: '', address: '서울', phone: '', relation: '자' },
      terms: { startDate: '2025-01-01', endDate: '2029-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '', account: '' },
    }));
    sessionStorage.setItem(CONTRACT_HANDOFF_KEY, JSON.stringify({
      startDate: '2026-02-01', endDate: '2030-01-31', paymentDay: 15, monthlyAmount: 250000,
    }));
    render(<App />);
    expect(screen.getByLabelText('증여자 성명')).toHaveProperty('value', '홍길동');
    await userEvent.type(screen.getByLabelText('증여자 주민등록번호'), '800101-1000008');
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findByLabelText('매월 증여액(원)')).toHaveProperty('value', '250,000');
    expect(screen.getByLabelText('증여시작일')).toHaveProperty('value', '2026-02-01');
    expect(screen.getByLabelText('매월 지급일')).toHaveProperty('value', '15');
    expect(sessionStorage.getItem(CONTRACT_HANDOFF_KEY)).toBeNull();
  });

  it('시뮬레이터 핸드오프가 있으면 가져온 조건을 안내한다 — 값이 2단계에 있어 안내 없이는 알 수 없다', () => {
    sessionStorage.setItem(CONTRACT_HANDOFF_KEY, JSON.stringify({
      startDate: '2026-09-01', endDate: '2036-08-31', paymentDay: 1, monthlyAmount: 200000,
    }));
    render(<App />);
    expect(screen.getByText(/시뮬레이터에서 계산한 조건/)).toBeTruthy();
    expect(screen.getByText(/₩200,000/)).toBeTruthy();
    expect(screen.getByText(/2026-09-01 ~ 2036-08-31/)).toBeTruthy();
  });

  it('핸드오프가 없으면 시뮬레이터 안내를 표시하지 않는다', () => {
    render(<App />);
    expect(screen.queryByText(/시뮬레이터에서 계산한 조건/)).toBeNull();
  });
});
