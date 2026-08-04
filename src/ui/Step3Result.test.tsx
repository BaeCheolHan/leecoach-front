// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Step3Result } from './steps/Step3Result';
import type { FormValues } from './schema';
import { savePdfFiles } from '../pdf/download';

// jsdom에서는 canvas·PDF 렌더가 불가하므로 PDF 생성 계층만 대체 (파일명 로직 등은 원본 유지)
vi.mock('../pdf/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../pdf/download')>()),
  renderPdfBlob: vi.fn(async () => new Blob(['pdf'], { type: 'application/pdf' })),
  savePdfFiles: vi.fn(async () => {}),
}));
vi.mock('../pdf/seal', () => ({ drawSeal: vi.fn(() => 'data:image/png;base64,') }));
vi.mock('../pdf/fonts', () => ({ registerFonts: vi.fn() }));

const values: FormValues = {
  donor: { name: '홍길동', rrn: '800101-1000008', address: '서울', phone: '' },
  donee: { name: '홍아기', rrn: '210301-3999999', address: '서울', phone: '', relation: '자' },
  terms: { startDate: '2026-01-01', endDate: '2035-12-31', method: '자동이체', paymentDay: 1, monthlyAmount: 100000, bank: '국민은행', account: '123' },
};

describe('Step3Result', () => {
  it('평가 표와 합계를 렌더한다 (픽스처 값)', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText('₩10,543,331')).toBeTruthy();  // 총 평가액
    expect(screen.getByText('₩12,000,000')).toBeTruthy();  // 총 불입원금
  });
  it('미성년 2천만 한도 이내 판정을 표시한다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText(/한도 이내.*예상 증여세.*0원/)).toBeTruthy();
  });
  it('다운로드 버튼 3개가 있다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByRole('button', { name: '증여계약서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '평가명세서 PDF' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '모두 다운로드' })).toBeTruthy();
  });
  it('문서 준비 중에는 버튼이 비활성화되고, 준비가 끝나면 활성화된다', async () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.getByText('문서 준비 중…')).toBeTruthy();
    expect((screen.getByRole('button', { name: '모두 다운로드' }) as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => {
      expect((screen.getByRole('button', { name: '증여계약서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      expect((screen.getByRole('button', { name: '평가명세서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      expect((screen.getByRole('button', { name: '모두 다운로드' }) as HTMLButtonElement).disabled).toBe(false);
    });
    expect(screen.queryByText('문서 준비 중…')).toBeNull();
  });
  it('관계가 기타이면 증여재산공제 미적용 경고를 표시한다', () => {
    const etcValues: FormValues = { ...values, donee: { ...values.donee, relation: '기타' } };
    render(<Step3Result values={etcValues} onBack={() => {}} />);
    expect(
      screen.getByText(/6촌 이내 혈족·4촌 이내 인척이 아닌 타인 간 증여는 증여재산공제가 적용되지 않습니다/),
    ).toBeTruthy();
  });
  it('관계가 기타가 아니면 증여재산공제 미적용 경고를 표시하지 않는다', () => {
    render(<Step3Result values={values} onBack={() => {}} />);
    expect(screen.queryByText(/증여재산공제가 적용되지 않습니다/)).toBeNull();
  });

  describe('저장 후 완료 페이지 이동', () => {
    const originalLocation = window.location;
    let assign: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      assign = vi.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, assign },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
      vi.mocked(savePdfFiles).mockReset().mockImplementation(async () => {});
    });

    const waitReady = async () => {
      await waitFor(() => {
        expect((screen.getByRole('button', { name: '증여계약서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      });
    };

    it('모두 다운로드로 둘 다 받으면 완료 페이지로 실제 이동한다(pushState 아님)', async () => {
      render(<Step3Result values={values} onBack={() => {}} />);
      await waitReady();

      fireEvent.click(screen.getByRole('button', { name: '모두 다운로드' }));

      await waitFor(() => expect(assign).toHaveBeenCalledWith('/contract/done'), { timeout: 2000 });
    });

    // 한 장만 받고 나머지를 받으려는 사용자를 완료 페이지로 끌고 가면 남은 서류를 못 받는다.
    it('계약서만 받은 상태에서는 이동하지 않는다', async () => {
      render(<Step3Result values={values} onBack={() => {}} />);
      await waitReady();

      fireEvent.click(screen.getByRole('button', { name: '증여계약서 PDF' }));

      await waitFor(() => {
        expect((screen.getByRole('button', { name: '평가명세서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      });
      expect(assign).not.toHaveBeenCalled();
    });

    it('계약서에 이어 명세서까지 받으면 그때 이동한다', async () => {
      render(<Step3Result values={values} onBack={() => {}} />);
      await waitReady();

      fireEvent.click(screen.getByRole('button', { name: '증여계약서 PDF' }));
      await waitFor(() => {
        expect((screen.getByRole('button', { name: '평가명세서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      });
      expect(assign).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: '평가명세서 PDF' }));

      await waitFor(() => expect(assign).toHaveBeenCalledWith('/contract/done'), { timeout: 2000 });
    });

    it('저장이 실패하면 이동하지 않는다', async () => {
      vi.mocked(savePdfFiles).mockRejectedValueOnce(new Error('저장 실패'));
      render(<Step3Result values={values} onBack={() => {}} />);
      await waitFor(() => {
        expect((screen.getByRole('button', { name: '증여계약서 PDF' }) as HTMLButtonElement).disabled).toBe(false);
      });

      fireEvent.click(screen.getByRole('button', { name: '증여계약서 PDF' }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
      expect(assign).not.toHaveBeenCalled();
    });
  });
});
