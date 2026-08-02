// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CONTRACT_HANDOFF_KEY, SIMULATOR_HANDOFF_KEY } from '../../storage/simHandoff';
import { Simulator } from './Simulator';

const handoff = {
  monthlyAmount: 150_000,
  startDate: '2026-01-01',
  endDate: '2030-12-31',
  paymentDay: 10,
  childBirthDate: '2021-03-01',
};

beforeEach(() => sessionStorage.clear());

describe('Simulator', () => {
  it('수익률 기본값 없이 단일 페이지 입력 폼을 렌더한다', () => {
    render(<Simulator />);
    expect(screen.getByRole('heading', { name: '자녀 증여자산 시뮬레이터' })).toBeTruthy();
    expect(screen.getByLabelText('연 가격상승률(%)')).toHaveProperty('value', '');
    expect(screen.getByLabelText('연 분배율(%)')).toHaveProperty('value', '');
    expect(screen.queryByRole('button', { name: /계산|제출/ })).toBeNull();
  });

  it('손대지 않은 폼에는 오류 대신 안내를 보여준다', () => {
    render(<Simulator />);
    expect(screen.getByText('조건을 모두 입력하면 결과가 나타납니다.')).toBeTruthy();
    expect(screen.queryByText('입력값을 확인해 주세요')).toBeNull();
    expect(screen.queryByText(/이하여야 합니다/)).toBeNull();
  });

  it('증여 방식 라디오는 하나의 그룹으로 묶인다', () => {
    render(<Simulator />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.every((radio) => radio.name !== '')).toBe(true);
  });

  it('계약서에서 넘긴 조건을 한 번 복원하고 안내한다', () => {
    sessionStorage.setItem(SIMULATOR_HANDOFF_KEY, JSON.stringify(handoff));
    render(<Simulator />);
    expect(screen.getByText(/계약서에서 입력한 조건을 불러왔어요/)).toBeTruthy();
    expect(screen.getByLabelText('매월 증여액(원)')).toHaveProperty('value', '150,000');
    expect(screen.getByLabelText('아이 생년월일')).toHaveProperty('value', '2021-03-01');
    expect(sessionStorage.getItem(SIMULATOR_HANDOFF_KEY)).toBeNull();
  });

  it('조건을 모두 채우면 상품 유형별 결과와 중립 안내를 보여준다', async () => {
    sessionStorage.setItem(SIMULATOR_HANDOFF_KEY, JSON.stringify(handoff));
    render(<Simulator />);
    await userEvent.type(screen.getByLabelText('연 가격상승률(%)'), '5');
    await userEvent.type(screen.getByLabelText('연 분배율(%)'), '2');

    expect(screen.queryByText('조건을 모두 입력하면 결과가 나타납니다.')).toBeNull();
    expect(screen.getByRole('heading', { name: '상품 유형별 결과' })).toBeTruthy();
    expect(screen.getByText(/투자 권유가 아닙니다/)).toBeTruthy();
    // 우열을 표시하지 않는다 — 세 유형이 동등하게 나열되어야 한다.
    expect(screen.queryByText(/추천|유리|베스트/)).toBeNull();
  });

  it('일시금에는 유기정기금 전용 계약서 CTA를 보여주지 않는다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByRole('radio', { name: /현금 일시금/ }));
    await userEvent.type(screen.getByLabelText('증여 금액(원)'), '20000000');
    await userEvent.type(screen.getByLabelText('증여일'), '2026-01-01');
    await userEvent.type(screen.getByLabelText('아이 생년월일'), '2021-03-01');
    await userEvent.type(screen.getByLabelText('연 가격상승률(%)'), '5');
    await userEvent.type(screen.getByLabelText('연 분배율(%)'), '2');

    expect(screen.getByRole('heading', { name: '상품 유형별 결과' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '이 조건으로 계약서 만들기' })).toBeNull();
    expect(sessionStorage.getItem(CONTRACT_HANDOFF_KEY)).toBeNull();
  });
});
