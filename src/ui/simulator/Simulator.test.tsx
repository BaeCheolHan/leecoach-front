// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
  it('아무 입력 없이도 상품 3종의 세후 금액을 즉시 보여준다', () => {
    render(<Simulator />);
    const summary = screen.getByTestId('simulator-result-summary');

    expect(within(summary).getByText('국내 주식형 ETF')).toBeTruthy();
    expect(within(summary).getByText('국내 상장 해외 ETF')).toBeTruthy();
    expect(within(summary).getByText('해외 상장 ETF')).toBeTruthy();
    expect(within(summary).getAllByText(/^₩[\d,]+$/)).toHaveLength(3);
    expect(screen.queryByText('조건을 모두 입력하면 결과가 나타납니다.')).toBeNull();
    expect(screen.queryByRole('button', { name: /계산|제출/ })).toBeNull();
  });

  it('가격상승률 슬라이더는 투자 수익률을 제시하지 않고 0에서 시작한다', () => {
    render(<Simulator />);
    const slider = screen.getByRole('slider', { name: '연 가격상승률' });

    expect(slider).toHaveProperty('value', '0');
    expect(slider).toHaveProperty('min', '-20');
    expect(slider).toHaveProperty('max', '20');
    expect(slider).toHaveProperty('step', '0.5');
  });

  it('슬라이더를 올리면 상품 간 세후 금액에 차이가 생긴다', () => {
    render(<Simulator />);
    fireEvent.change(screen.getByRole('slider', { name: '연 가격상승률' }), { target: { value: '5' } });

    const amounts = within(screen.getByTestId('simulator-result-summary'))
      .getAllByText(/^₩[\d,]+$/)
      .map((element) => element.textContent);
    expect(new Set(amounts).size).toBeGreaterThan(1);
  });

  it('입력 옵션은 접고 상세 내역은 펼친 채로 보여준다', () => {
    render(<Simulator />);

    expect(screen.getByText('자세히 설정').closest('details')?.hasAttribute('open')).toBe(false);
    // 세후 금액이 갈리는 이유가 상세 내역에 있으므로 접지 않는다.
    expect(screen.getByRole('heading', { name: '상세 내역' })).toBeTruthy();
    expect(screen.getByText('상세 내역').closest('details')).toBeNull();
    expect(screen.getByRole('row', { name: /매도 세금/ })).toBeTruthy();
  });

  it('상품의 우열을 표현하지 않는다', () => {
    render(<Simulator />);
    expect(screen.queryByText(/추천|유리|베스트/)).toBeNull();
  });

  it('증여 방식 라디오는 하나의 그룹으로 묶인다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByText('자세히 설정'));
    const details = screen.getByText('자세히 설정').closest('details')!;
    const radios = within(details).getAllByRole('radio') as HTMLInputElement[];

    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.every((radio) => radio.name !== '')).toBe(true);
  });

  it('계약서에서 넘긴 조건과 생년월일에서 역산한 아이 나이를 복원한다', () => {
    sessionStorage.setItem(SIMULATOR_HANDOFF_KEY, JSON.stringify(handoff));
    render(<Simulator />);

    const today = new Date();
    const birthdayPassed = today.getMonth() > 2 || (today.getMonth() === 2 && today.getDate() >= 1);
    const expectedAge = today.getFullYear() - 2021 - (birthdayPassed ? 0 : 1);
    expect(screen.getByText(/계약서에서 입력한 조건을 불러왔어요/)).toBeTruthy();
    expect(screen.getByLabelText('매월 증여액')).toHaveProperty('value', '150,000');
    expect(screen.getByLabelText('아이 나이')).toHaveProperty('value', String(expectedAge));
    expect(screen.getByLabelText('증여 기간')).toHaveProperty('value', '5');
    expect(sessionStorage.getItem(SIMULATOR_HANDOFF_KEY)).toBeNull();
  });

  it('일시금 선택 시 유기정기금 전용 계약서 CTA를 보여주지 않는다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByText('자세히 설정'));
    await userEvent.click(screen.getByRole('radio', { name: /현금 일시금/ }));

    expect(screen.queryByRole('button', { name: '이 조건으로 계약서 만들기' })).toBeNull();
    expect(sessionStorage.getItem(CONTRACT_HANDOFF_KEY)).toBeNull();
  });

  it('기본은 금액으로 계산 모드이며 목표 금액 입력은 보이지 않는다', () => {
    render(<Simulator />);

    expect(screen.getByRole('radio', { name: '금액으로 계산' })).toHaveProperty('checked', true);
    expect(screen.queryByLabelText('목표 금액')).toBeNull();
  });

  it('목표로 역산하면 목표 입력과 필요 금액 결과를 보여준다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByRole('radio', { name: '목표로 역산' }));

    expect(screen.getByLabelText('목표 금액')).toHaveProperty('value', '40,000,000');
    expect(screen.getByRole('heading', { name: '상품별 필요 금액' })).toBeTruthy();
    expect(screen.getByText('세후 ₩40,000,000을 만들려면')).toBeTruthy();
  });

  it('목표 역산 모드에서는 증여 단계 한 줄 요약을 숨긴다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByRole('radio', { name: '목표로 역산' }));

    expect(screen.queryByLabelText('증여 단계')).toBeNull();
  });

  it('목표 역산 필요 금액은 수익률이 있을 때 세 상품 모두 같지는 않다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByRole('radio', { name: '목표로 역산' }));
    fireEvent.change(screen.getByRole('slider', { name: '연 가격상승률' }), { target: { value: '5' } });

    const amounts = within(screen.getByTestId('simulator-result-summary'))
      .getAllByText(/^₩[\d,]+\/월$/)
      .map((element) => element.textContent);
    expect(amounts).toHaveLength(3);
    expect(new Set(amounts).size).toBeGreaterThan(1);
  });

  it('목표 역산 모드에도 우열 표현이 없다', async () => {
    render(<Simulator />);
    await userEvent.click(screen.getByRole('radio', { name: '목표로 역산' }));

    expect(screen.queryByText(/추천|유리|베스트/)).toBeNull();
  });
});
