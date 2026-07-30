/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // UI 테스트 파일은 개별 @vitest-environment jsdom 주석 사용
    setupFiles: ['./vitest-setup-jsdom.ts'],
  },
})
