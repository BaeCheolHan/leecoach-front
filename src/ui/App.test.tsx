// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

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

  it('미성년 수증자 주민번호 입력 시 법정대리인 입력란이 나타난다', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('수증자 주민등록번호'), '210301-3999999');
    expect(await screen.findByLabelText('법정대리인 성명')).toBeTruthy();
  });
});
