import "@testing-library/jest-dom";
import { vi } from "vitest";

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
