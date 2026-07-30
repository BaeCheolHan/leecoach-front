import { Font } from '@react-pdf/renderer';

let registered = false;

/** 나눔명조 등록. 브라우저는 기본 '/fonts', node 테스트는 절대 파일 경로를 전달한다. */
export function registerFonts(base = '/fonts'): void {
  if (registered) return;
  Font.register({
    family: 'NanumMyeongjo',
    fonts: [
      { src: `${base}/NanumMyeongjo-Regular.ttf`, fontWeight: 'normal' },
      { src: `${base}/NanumMyeongjo-Bold.ttf`, fontWeight: 'bold' },
    ],
  });
  // 한글은 단어 중간 줄바꿈 허용
  Font.registerHyphenationCallback((word) => [...word].flatMap((c) => [c, '']));
  registered = true;
}
