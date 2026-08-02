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

  it('가격상승률은 투자 수익률을 제시하지 않고 0에서 시작한다', () => {
    render(<Simulator />);
    const growth = screen.getByLabelText('연 가격상승률') as HTMLInputElement;

    expect(growth).toHaveProperty('value', '0');
    // 다른 조건과 같은 숫자 입력이어야 원하는 값을 정확히 넣을 수 있다.
    expect(growth.type).toBe('number');
    expect(growth).toHaveProperty('min', '-20');
    expect(growth).toHaveProperty('max', '20');
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('소수점 수익률도 그대로 입력된다', () => {
    render(<Simulator />);
    fireEvent.change(screen.getByLabelText('연 가격상승률'), { target: { value: '7.2' } });

    expect(screen.getByLabelText('연 가격상승률')).toHaveProperty('value', '7.2');
  });

  it('수익률을 올리면 상품 간 세후 금액에 차이가 생긴다', () => {
    render(<Simulator />);
    fireEvent.change(screen.getByLabelText('연 가격상승률'), { target: { value: '5' } });

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

  // 아래 두 묶음은 "사용자가 실제로 넣을 값"을 전수로 밟는다.
  // 렌더링만 확인하던 방식으로는 평범한 입력에서 나던 오류를 놓쳤다.
  it.each([
    [0, 1], [0, 10], [0, 20],
    [5, 1], [5, 10], [5, 20],
    [10, 10], [15, 5], [18, 1],
  ])('아이 %i살 / 증여 %i년이면 증여가 끝나는 나이에 인출한다', (age, years) => {
    render(<Simulator />);
    fireEvent.change(screen.getByLabelText('아이 나이'), { target: { value: String(age) } });
    fireEvent.change(screen.getByLabelText('증여 기간'), { target: { value: String(years) } });

    expect(screen.queryByText('입력값을 확인해 주세요')).toBeNull();
    fireEvent.click(screen.getByText('자세히 설정'));
    expect(screen.getByLabelText('인출 시점'))
      .toHaveProperty('value', String(Math.max(19, age + years)));
  });

  it.each([
    ['아이 나이', '', '아이 나이를 입력해 주세요.'],
    ['증여 기간', '0', '증여 기간은 1년 이상이어야 합니다.'],
    ['연 가격상승률', '', '연 가격상승률을 입력해 주세요. 0을 넣으면 수익이 없는 경우로 계산합니다.'],
  ])('%s이(가) 비거나 잘못되면 그 필드를 가리키는 안내를 보여준다', (label, value, expected) => {
    render(<Simulator />);
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

    expect(screen.getByText(expected)).toBeTruthy();
    // 도메인 용어('자녀 생년월일', '증여 종료일')는 이 화면에 없는 필드라 노출하면 안 된다.
    expect(screen.queryByText(/자녀 생년월일|증여 종료일/)).toBeNull();
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
    fireEvent.change(screen.getByLabelText('연 가격상승률'), { target: { value: '5' } });

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
