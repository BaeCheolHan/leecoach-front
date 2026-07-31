// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InAppBrowserNotice, isInAppBrowser } from './InAppBrowserNotice';

const IG_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Instagram 320.0.0.0';
const SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('isInAppBrowser', () => {
  it('인스타그램·카카오톡 인앱 UA를 감지한다', () => {
    expect(isInAppBrowser(IG_UA)).toBe(true);
    expect(isInAppBrowser('... KAKAOTALK 10.0.0 ...')).toBe(true);
  });
  it('일반 사파리·크롬 UA는 감지하지 않는다', () => {
    expect(isInAppBrowser(SAFARI_UA)).toBe(false);
  });
});

describe('InAppBrowserNotice', () => {
  it('인앱 브라우저에서 안내를 표시하고, 닫기를 누르면 사라진다', async () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: IG_UA, configurable: true });
    render(<InAppBrowserNotice />);
    expect(screen.getByText(/외부 브라우저로 열기/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '안내 닫기' }));
    expect(screen.queryByText(/외부 브라우저로 열기/)).toBeNull();
  });
  it('일반 브라우저에서는 아무것도 표시하지 않는다', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: SAFARI_UA, configurable: true });
    const { container } = render(<InAppBrowserNotice />);
    expect(container.innerHTML).toBe('');
  });
});
