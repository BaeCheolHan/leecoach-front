// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import { RootErrorBoundary } from './RootErrorBoundary';

/** 던지는 컴포넌트 — 실제 청크 로드 실패를 흉내 낸다. */
function Boom({ message }: { message: string }): React.ReactElement {
  throw new Error(message);
}

const reload = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  reload.mockClear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });
  // 경계가 잡는 오류는 React가 콘솔로도 흘리므로 테스트 출력만 조용히 한다.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('RootErrorBoundary', () => {
  it('정상일 때는 자식을 그대로 렌더한다', () => {
    render(<RootErrorBoundary><p>정상 화면</p></RootErrorBoundary>);
    expect(screen.getByText('정상 화면')).toBeTruthy();
  });

  it('청크 로드 실패면 한 번만 자동 새로고침한다', () => {
    // 배포 직후 캐시된 index.html이 사라진 청크를 요청할 때 나는 실제 메시지.
    render(
      <RootErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module: /assets/Simulator-abc123.js" />
      </RootErrorBoundary>,
    );

    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('chunk-reload-attempted')).toBe('1');
  });

  it('이미 새로고침을 시도했으면 다시 새로고침하지 않고 안내를 보여준다', () => {
    sessionStorage.setItem('chunk-reload-attempted', '1');
    render(
      <RootErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module" />
      </RootErrorBoundary>,
    );

    // 무한 새로고침 루프를 만들지 않는 것이 핵심이다.
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '페이지를 불러오지 못했습니다' })).toBeTruthy();
  });

  it('청크와 무관한 오류는 새로고침하지 않고 안내와 이동 링크를 보여준다', () => {
    render(<RootErrorBoundary><Boom message="something else broke" /></RootErrorBoundary>);

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '페이지를 불러오지 못했습니다' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '계약서 만들기' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: '증여 가이드' }).getAttribute('href')).toBe('/guide');
  });
});
