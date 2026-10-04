import "@testing-library/jest-dom";
import { vi } from "vitest";

// Node 26 exposes an experimental global `localStorage` that is unavailable
// unless the process receives a persistence file. It can shadow jsdom's
// in-memory implementation and make browser-focused tests environment-specific.
// Use one deterministic, per-worker store in tests on every supported Node.
const testStorage = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return testStorage.size;
  },
  clear: () => testStorage.clear(),
  getItem: (key) => testStorage.get(key) ?? null,
  key: (index) => Array.from(testStorage.keys())[index] ?? null,
  removeItem: (key) => {
    testStorage.delete(key);
  },
  setItem: (key, value) => {
    testStorage.set(key, String(value));
  },
};

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageMock,
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly scrollMargin = "0px";
  readonly thresholds = [0];

  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Canvas for Three.js tests
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
  if (type === "webgl" || type === "webgl2") {
    return {
      canvas: {},
      drawingBufferWidth: 1024,
      drawingBufferHeight: 768,
      // Add minimal WebGL context mock
      getExtension: vi.fn(),
      getParameter: vi.fn(),
      createShader: vi.fn(),
      createProgram: vi.fn(),
    };
  }
  return {};
});
