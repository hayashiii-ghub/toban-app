import "@testing-library/jest-dom/vitest";
import { MotionGlobalConfig } from "framer-motion";
import { beforeEach, vi } from "vitest";

// 本物の framer-motion を描画し、アニメーションだけ即時に終わらせる。
// アプリは LazyMotion で包んだ m を使うが、単体テストは包まずに描画するので、
// 機能を同梱した motion を m として渡す。
MotionGlobalConfig.skipAnimations = true;
vi.mock("framer-motion", async importOriginal => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, m: actual.motion };
});

// framer-motion が matchMedia を参照するため stub
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// window.print stub
window.print = vi.fn();

// jsdom は scrollIntoView を実装していない
Element.prototype.scrollIntoView = vi.fn();

// この構成の jsdom には localStorage が無く、safeGetItem が常に null を返すため、
// アプリの主データストアである保存→読込の往復がテストで一度も通らなかった。
// 実物と同じ挙動のものを置いて、その経路を検証できるようにする。
// （個別に差し替えたいテストは vi.stubGlobal("localStorage", ...) で上書きできる）
const localStorageStore = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, value: string) =>
      void localStorageStore.set(key, String(value)),
    removeItem: (key: string) => void localStorageStore.delete(key),
    clear: () => localStorageStore.clear(),
    key: (i: number) => [...localStorageStore.keys()][i] ?? null,
    get length() {
      return localStorageStore.size;
    },
  },
});

// テスト間で保存内容が漏れないようにする
beforeEach(() => localStorageStore.clear());
