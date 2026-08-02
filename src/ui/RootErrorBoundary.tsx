import { Component, type ErrorInfo, type ReactNode } from 'react';

const RELOAD_FLAG = 'chunk-reload-attempted';

/**
 * 배포 직후 방문자는 이전 index.html이 캐시돼 있어 이미 삭제된 청크를 요청하게 된다.
 * 새로고침하면 최신 index.html을 받아 해결되므로, 이 경우로 보이면 1회만 자동 새로고침한다.
 * (무한 새로고침을 막으려 sessionStorage로 한 번만 시도한다.)
 */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i
    .test(message);
}

interface State {
  failed: boolean;
}

/**
 * 모든 페이지가 React.lazy로 로드되므로, 청크 로드가 실패하면 잡아 줄 곳이 없어
 * 앱 전체가 빈 화면이 된다. 실제로 흰 화면 신고가 있었다.
 */
export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
      return;
    }
    console.error('페이지를 표시하지 못했습니다', error, info.componentStack);
  }

  componentDidMount() {
    // 정상적으로 그려졌을 때만 표시를 지운다. 실패한 상태에서도 지우면 가드가 풀려
    // 새로고침 → 실패 → 새로고침이 무한 반복된다.
    if (!this.state.failed) sessionStorage.removeItem(RELOAD_FLAG);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="container notfound">
        <h1>페이지를 불러오지 못했습니다</h1>
        <p>
          일시적인 문제일 수 있습니다. 새로고침해도 같은 화면이 나오면 아래에서 다른 페이지로
          이동해 보세요.
        </p>
        <p className="notfound-links">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            새로고침
          </button>
          <a className="btn-secondary" href="/">
            계약서 만들기
          </a>
          <a className="btn-secondary" href="/guide">
            증여 가이드
          </a>
        </p>
      </main>
    );
  }
}
