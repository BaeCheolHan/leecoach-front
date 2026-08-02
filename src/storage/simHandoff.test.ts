// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONTRACT_HANDOFF_KEY,
  SIMULATOR_HANDOFF_KEY,
  loadToContract,
  loadToSimulator,
  saveToContract,
  saveToSimulator,
} from './simHandoff';

beforeEach(() => sessionStorage.clear());

describe('simulator handoff storage', () => {
  it('시뮬레이터 값을 한 번만 불러온다', () => {
    const value = {
      monthlyAmount: 100_000,
      startDate: '2026-01-01',
      endDate: '2035-12-31',
      paymentDay: 1,
      childBirthDate: '2021-03-01',
    };
    saveToSimulator(value);
    expect(loadToSimulator()).toEqual(value);
    expect(loadToSimulator()).toBeNull();
  });

  it('계약서 값을 한 번만 불러온다', () => {
    const value = { monthlyAmount: 200_000, startDate: '2026-02-01', endDate: '2030-01-31', paymentDay: 15 };
    saveToContract(value);
    expect(loadToContract()).toEqual(value);
    expect(loadToContract()).toBeNull();
  });

  it('깨진 JSON은 제거하고 null을 반환한다', () => {
    sessionStorage.setItem(SIMULATOR_HANDOFF_KEY, '{broken');
    expect(loadToSimulator()).toBeNull();
    expect(sessionStorage.getItem(SIMULATOR_HANDOFF_KEY)).toBeNull();
  });

  it('저장된 JSON에 이름·연락처·주민등록번호 키가 없다', () => {
    saveToSimulator({
      monthlyAmount: 100_000,
      startDate: '2026-01-01',
      endDate: '2035-12-31',
      paymentDay: 1,
      childBirthDate: '2021-03-01',
    });
    saveToContract({ monthlyAmount: 100_000, startDate: '2026-01-01', endDate: '2035-12-31', paymentDay: 1 });

    for (const key of [SIMULATOR_HANDOFF_KEY, CONTRACT_HANDOFF_KEY]) {
      const stored = JSON.parse(sessionStorage.getItem(key)!);
      expect(stored).not.toHaveProperty('name');
      expect(stored).not.toHaveProperty('phone');
      expect(stored).not.toHaveProperty('rrn');
      expect(stored).not.toHaveProperty('donor');
      expect(stored).not.toHaveProperty('donee');
    }
  });
});
