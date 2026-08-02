/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // UI 테스트 파일은 개별 @vitest-environment jsdom 주석 사용
    setupFiles: ['./vitest-setup-jsdom.ts'],
    // 로컬 도구가 만든 별도 worktree·빌드 산출물의 테스트를 현재 프로젝트와 섞지 않는다.
    exclude: [...configDefaults.exclude, '**/.claude/**', '**/.wrangler/**'],
  },
})
