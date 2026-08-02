export interface ToSimulator {
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  paymentDay: number;
  childBirthDate: string;
}

export interface ToContract {
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  paymentDay: number;
}

export const SIMULATOR_HANDOFF_KEY = 'gift-sim-handoff-v1';
export const CONTRACT_HANDOFF_KEY = 'gift-contract-handoff-v1';

function loadOnce<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToSimulator(value: ToSimulator): void {
  sessionStorage.setItem(SIMULATOR_HANDOFF_KEY, JSON.stringify(value));
}

export function loadToSimulator(): ToSimulator | null {
  return loadOnce<ToSimulator>(SIMULATOR_HANDOFF_KEY);
}

export function saveToContract(value: ToContract): void {
  sessionStorage.setItem(CONTRACT_HANDOFF_KEY, JSON.stringify(value));
}

export function loadToContract(): ToContract | null {
  return loadOnce<ToContract>(CONTRACT_HANDOFF_KEY);
}
